use crate::cache_files::{CachedImage, ImageCache};
use crate::file_schema::FileSchema;
use crate::DbConn;
use image::{DynamicImage, ImageError, ImageFormat};
use rocket::response::{Flash, Redirect};
use rocket::State;
use std::fs::File;
use std::io::{Cursor, Read};

#[get("/<hash>/download?<width>&<height>")]
pub async fn retrieve_file(
    hash: &str,
    conn: DbConn,
    width: Option<usize>,
    height: Option<usize>,
) -> Result<CachedImage, Flash<Redirect>> {
    let file_schema_vec = FileSchema::get_by_hash(hash.to_string(), &conn).await;
    let file_schemas = file_schema_vec.unwrap();

    match file_schemas.first() {
        None => Err(Flash::error(Redirect::to("/"), "file not found.")),
        Some(f_schema) => {
            if width.is_some() && height.is_some() {
                let image_width = width.unwrap();
                let image_height = height.unwrap();
                if image_width as i32 > f_schema.width || image_height as i32 > f_schema.height {
                    let img = image::open(&f_schema.path).ok();
                    let rimg = img.unwrap().resize(
                        width.unwrap() as u32,
                        height.unwrap() as u32,
                        image::imageops::FilterType::Lanczos3,
                    );
                    let buffer = create_image_buffer(f_schema, &rimg);

                    return Ok(CachedImage(buffer));
                }
            }

            let file_buffer = File::open(&f_schema.path).ok();
            let mut buffer = Vec::new();

            if file_buffer.is_some() {
                file_buffer
                    .unwrap()
                    .read_to_end(&mut buffer)
                    .expect("Unable to read file or file not found");
            }

            Ok(CachedImage(buffer))
        }
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
    let cache_key = "thumb_".to_string() + folder;

    if let Some(data) = cache.get(&cache_key) {
        return Ok(CachedImage(data));
    }

    let file_schema_vec = FileSchema::random(&conn, folder.to_string(), 1, "*".to_string(), "*".to_string(), "*".to_string(), false, 0).await;
    let file_schemas = file_schema_vec.unwrap();

    match file_schemas.first() {
        None => Err(Flash::error(Redirect::to("/"), "file not found.")),
        Some(f_schema) => {
            let image_width = width.unwrap_or(150);
            let image_height = height.unwrap_or(150);

            match image_width as i32 <= f_schema.width || image_height as i32 <= f_schema.height {
                true => match image::open(&f_schema.path) {
                    Ok(thumb_dynamic_image) => {
                        let t_dynamic_image = thumb_dynamic_image.resize(
                            width.unwrap() as u32,
                            height.unwrap() as u32,
                            image::imageops::FilterType::Lanczos3,
                        );
                        let buffer = create_image_buffer(f_schema, &t_dynamic_image);
                        cache.insert(cache_key, buffer.clone());

                        Ok(CachedImage(buffer))
                    }
                    Err(err) => {
                        let buffer = Vec::new();

                        match err {
                            ImageError::Decoding(_) => {}
                            ImageError::Encoding(_) => {}
                            ImageError::Parameter(_) => {}
                            ImageError::Limits(_) => {}
                            ImageError::Unsupported(_) => {}
                            ImageError::IoError(ierr) => {
                                println!("{}: {}", ierr, &f_schema.path);
                            }
                        }

                        Ok(CachedImage(buffer))
                    }
                },
                false => {
                    let file_buffer = File::open(&f_schema.path).ok();
                    let mut buffer = Vec::new();
                    let _ = file_buffer.unwrap().read_to_end(&mut buffer);

                    Ok(CachedImage(buffer))
                }
            }
        }
    }
}

pub fn create_image_buffer(f_schema: &FileSchema, t_dynamic_image: &DynamicImage) -> Vec<u8> {
    let format = match f_schema.extention.as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "gif" => ImageFormat::Gif,
        "webp" => ImageFormat::WebP,
        _ => ImageFormat::Avif,
    };

    let mut buffer = Vec::new();
    t_dynamic_image
        .write_to(&mut Cursor::new(&mut buffer), format)
        .expect("Impossible to set ImageFormat");
    buffer
}
