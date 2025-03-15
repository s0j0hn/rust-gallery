use crate::DbConn;
use crate::cache_files::{CachedImage, ImageCache};
use crate::models::file::repository::FileSchema;
use image::{DynamicImage, ImageFormat};
use rocket::http::ContentType;
use rocket::http::Status;
use rocket::response::status;
use rocket::serde::json::{Json, Value, json};
use rocket::{Either, State};
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;
use std::time::Duration;

// Helper function to determine content type from file extension
fn get_content_type(extension: &str) -> ContentType {
    match extension.to_lowercase().as_str() {
        "png" => ContentType::PNG,
        "jpg" | "jpeg" => ContentType::JPEG,
        "gif" => ContentType::GIF,
        "webp" => ContentType::new("image", "webp"),
        "avif" => ContentType::new("image", "avif"),
        _ => ContentType::JPEG, // Default
    }
}

// Helper function to create CachedImage with caching headers
fn create_cached_image(data: Vec<u8>, extension: &str, cache_duration_secs: u64) -> CachedImage {
    let content_type = get_content_type(extension);
    let cache_duration = Duration::from_secs(cache_duration_secs);
    CachedImage::with_cache(data, content_type, cache_duration)
}

#[get("/<hash>/download?<width>&<height>")]
pub async fn retrieve_file(
    hash: &str,
    conn: DbConn,
    width: Option<usize>,
    height: Option<usize>,
) -> Either<CachedImage, status::Custom<Json<Value>>> {
    let f_schema = match FileSchema::get_by_hash(hash.to_string(), &conn).await {
        Ok(schema) => schema,
        Err(e) => {
            return Either::Right(status::Custom(
                Status::InternalServerError,
                Json(json!({"error": format!("Database error occurred {}", e)})),
            ));
        }
    };

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
                    // For resized images
                    let buffer = create_image_buffer(&f_schema, &resized_img);
                    Either::Left(create_cached_image(buffer, &f_schema.extention, 86400)) // Cache for 1 day
                }
                Err(e) => {
                    return Either::Right(status::Custom(
                        Status::InternalServerError,
                        Json(json!({"error": format!("Database error occurred {}", e)})),
                    ));
                }
            };
        }
    }

    // Otherwise return the original file
    match read_file_to_buffer(&f_schema.path) {
        Ok(buffer) => Either::Left(create_cached_image(buffer, &f_schema.extention, 86400)), // Cache for 1 day,
        Err(e) => Either::Right(status::Custom(
            Status::InternalServerError,
            Json(json!({"error": format!("Database error occurred {}", e)})),
        )),
    }
}

#[get("/thumbnail/folder/download?<folder>&<width>&<height>&<number>")]
pub async fn get_thumbnail_folder(
    conn: DbConn,
    folder: &str,
    number: Option<usize>,
    width: Option<usize>,
    height: Option<usize>,
    cache: &State<ImageCache>,
) -> Either<CachedImage, status::Custom<Json<Value>>> {
    let cache_key = format!("thumb_{}_{}", folder, number.unwrap_or(1));

    // Return cached thumbnail if available
    if let Some(data) = cache.get(&cache_key) {
        let extension = "jpg"; // Default extension
        return Either::Left(create_cached_image(data, extension, 604800)); // Cache for 1 week
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
        0,
    )
    .await
    {
        Ok(schemas) => schemas,
        Err(_) => {
            return Either::Right(status::Custom(
                Status::InternalServerError,
                Json(json!({"error": "Database error occurred"})),
            ));
        }
    };

    let f_schema = match file_schema_vec.first() {
        Some(schema) => schema,
        None => {
            return Either::Right(status::Custom(
                Status::NotFound,
                Json(json!({"error": "No files found in folder"})),
            ));
        }
    };

    let image_width = width.unwrap_or(150) as u32;
    let image_height = height.unwrap_or(150) as u32;

    // Check if file exists before attempting to open
    if !Path::new(&f_schema.path).exists() {
        return Either::Right(status::Custom(
            Status::NotFound,
            Json(json!({"error": "File not found"})),
        ));
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
                cache.insert(cache_key, buffer.clone());
                return Either::Left(create_cached_image(buffer, &f_schema.extention, 604800)); // Cache for 1 week
            }
            Err(err) => {
                // Log the error but don't expose details to user
                eprintln!("Image processing error for {}: {:?}", &f_schema.path, err);
                return Either::Right(status::Custom(
                    Status::InternalServerError,
                    Json(json!({"error": "Failed to process image"})),
                ));
            }
        }
    }

    // Return original file if no resizing needed
    match read_file_to_buffer(&f_schema.path) {
        Ok(buffer) => Either::Left(create_cached_image(buffer, &f_schema.extention, 604800)), // Cache for 1 week`
        Err(_) => Either::Right(status::Custom(
            Status::InternalServerError,
            Json(json!({"error": "File not found or cannot be read"})),
        )),
    }
}

#[get("/thumbnail/photo/download?<hash>&<width>&<height>")]
pub async fn get_thumbnail_photo(
    conn: DbConn,
    hash: &str,
    width: Option<usize>,
    height: Option<usize>,
    cache: &State<ImageCache>,
) -> Either<CachedImage, status::Custom<Json<Value>>> {
    let cache_key = format!("thumb_{}", hash);

    // Return cached thumbnail if available
    if let Some(data) = cache.get(&cache_key) {
        let extension = "jpg"; // Default extension
        return Either::Left(create_cached_image(data, extension, 604800)); // Cache for 1 week
    }

    // Get random file from folder
    let f_schema = match FileSchema::get_by_hash(hash.to_string(), &conn).await {
        Ok(schemas) => schemas,
        Err(e) => {
            return Either::Right(status::Custom(
                Status::InternalServerError,
                Json(json!({"error": format!("Database error occurred {}", e)})),
            ));
        }
    };

    let image_width = width.unwrap_or(150) as u32;
    let image_height = height.unwrap_or(150) as u32;

    // Check if file exists before attempting to open
    if !Path::new(&f_schema.path).exists() {
        return Either::Right(status::Custom(
            Status::NotFound,
            Json(json!({"error": "File not found"})),
        ));
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

                let buffer = create_image_buffer(&f_schema, &resized_img);
                cache.insert(cache_key, buffer.clone());
                return Either::Left(create_cached_image(buffer, &f_schema.extention, 604800)); // Cache for 1 week
            }
            Err(err) => {
                // Log the error but don't expose details to user
                eprintln!("Image processing error for {}: {:?}", &f_schema.path, err);
                return Either::Right(status::Custom(
                    Status::InternalServerError,
                    Json(json!({"error": "Failed to process image"})),
                ));
            }
        }
    }

    // Return original file if no resizing needed
    match read_file_to_buffer(&f_schema.path) {
        Ok(buffer) => Either::Left(create_cached_image(buffer, &f_schema.extention, 604800)), // Cache for 1 week
        Err(_) => Either::Right(status::Custom(
            Status::InternalServerError,
            Json(json!({"error": "File not found or cannot be read"})),
        )),
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
