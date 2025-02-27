
use crate::cache_files::{CachedImage, ImageCache};
use crate::DbConn;
use crate::models::file::repository::FileSchema;
use image::{DynamicImage, ImageFormat};
use rocket::response::{Flash, Redirect};
use rocket::State;
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;

#[get("/<hash>/download?<width>&<height>")]
pub async fn retrieve_file(
    hash: &str,
    conn: DbConn,
    width: Option<usize>,
    height: Option<usize>,
) -> Result<CachedImage, Flash<Redirect>> {
    let file_schema_vec = match FileSchema::get_by_hash(hash.to_string(), &conn).await {
        Ok(schemas) => schemas,
        Err(_) => return Err(Flash::error(Redirect::to("/"), "database error")),
    };

    let f_schema = file_schema_vec
        .first()
        .ok_or_else(|| Flash::error(Redirect::to("/"), "file not found"))?;

    // Check if resizing is needed
    if let (Some(image_width), Some(image_height)) = (width, height) {
        if image_width as i32 > f_schema.width || image_height as i32 > f_schema.height {
            return match image::open(&f_schema.path) {
                Ok(img) => {
                    let resized_img = img.resize(
                        image_width as u32,
                        image_height as u32,
                        image::imageops::FilterType::Lanczos3,
                    );
                    let buffer = create_image_buffer(f_schema, &resized_img);
                    Ok(CachedImage(buffer))
                }
                Err(_) => Err(Flash::error(Redirect::to("/"), "failed to process image")),
            };
        }
    }

    // Otherwise return the original file
    match read_file_to_buffer(&f_schema.path) {
        Ok(buffer) => Ok(CachedImage(buffer)),
        Err(_) => Err(Flash::error(Redirect::to("/"), "file not found or cannot be read")),
    }
}

#[get("/thumbnail/download?<folder>&<width>&<height>")]
pub async fn get_thumbnail_folder(
    conn: DbConn,
    folder: &str,
    width: Option<usize>,
    height: Option<usize>,
    cache: &State<ImageCache>,
) -> Result<CachedImage, Flash<Redirect>> {
    let cache_key = format!("thumb_{}", folder);

    // Return cached thumbnail if available
    if let Some(data) = cache.get(&cache_key) {
        return Ok(CachedImage(data));
    }

    // Get random file from folder
    let file_schema_vec = match FileSchema::random(
        &conn,
        folder.to_string(),
        1,
        "*".to_string(),
        "*".to_string(),
        "*".to_string(),
        false,
        0
    ).await {
        Ok(schemas) => schemas,
        Err(_) => return Err(Flash::error(Redirect::to("/"), "database error")),
    };

    let f_schema = match file_schema_vec.first() {
        Some(schema) => schema,
        None => return Err(Flash::error(Redirect::to("/"), "no files found in folder")),
    };

    let image_width = width.unwrap_or(150) as u32;
    let image_height = height.unwrap_or(150) as u32;

    // Check if file exists before attempting to open
    if !Path::new(&f_schema.path).exists() {
        return Err(Flash::error(Redirect::to("/"), "file not found"));
    }

    // Generate thumbnail
    if image_width as i32 <= f_schema.width || image_height as i32 <= f_schema.height {
        match image::open(&f_schema.path) {
            Ok(img) => {
                let resized_img = img.resize(
                    image_width,
                    image_height,
                    image::imageops::FilterType::Lanczos3,
                );
                let buffer = create_image_buffer(f_schema, &resized_img);

                // Cache the buffer
                cache.insert(cache_key, buffer.clone());
                return Ok(CachedImage(buffer));
            }
            Err(err) => {
                // Log the error but don't expose details to user
                eprintln!("Image processing error for {}: {:?}", &f_schema.path, err);
                return Err(Flash::error(Redirect::to("/"), "failed to process image"));
            }
        }
    }

    // Return original file if no resizing needed
    match read_file_to_buffer(&f_schema.path) {
        Ok(buffer) => Ok(CachedImage(buffer)),
        Err(_) => Err(Flash::error(Redirect::to("/"), "file not found or cannot be read")),
    }
}

fn read_file_to_buffer(path: &str) -> std::io::Result<Vec<u8>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    Ok(buffer)
}

pub fn create_image_buffer(f_schema: &FileSchema, image: &DynamicImage) -> Vec<u8> {
    let format = match f_schema.extention.as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "gif" => ImageFormat::Gif,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Avif,
    };

    let mut buffer = Vec::new();
    if let Err(e) = image.write_to(&mut Cursor::new(&mut buffer), format) {
        eprintln!("Error encoding image: {:?}", e);
        return Vec::new(); // Return empty buffer on error
    }
    buffer
}