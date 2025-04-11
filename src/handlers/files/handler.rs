use crate::DbConn;
use crate::cache_files::{CachedImage, ImageCache, StateFiles};
use crate::handlers::files::utils::{
    create_cached_image, create_image_buffer, read_file_to_buffer,
};
use crate::models::file::repository::FileSchema;
use rocket::form::FromForm;
use rocket::http::Status;
use rocket::response::status;
use rocket::serde::Serialize;
use rocket::serde::json::{Json, Value, json};
use rocket::{Either, State};
use std::path::Path;

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
                Json(json!({"error": format!("Database error: {}", e)})),
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
                        Json(json!({"error": format!("Image processing error: {}", e)})),
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
            Json(json!({"error": format!("File read error: {}", e)})),
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
    )
    .await
    {
        Ok(schemas) => schemas,
        Err(e) => {
            return Either::Right(status::Custom(
                Status::InternalServerError,
                Json(json!({"error": format!("Database error: {}", e)})),
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
                    Json(json!({"error": format!("Failed to process image thumbnail: {}", err)})),
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
                    Json(json!({"error": format!("Failed to process image thumbnail: {}", err)})),
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

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonFileResponse {
    items: Vec<FileSchema>,
    page: usize,
    total: usize,
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonFileTagsResponse {
    tags: Vec<String>,
}

impl JsonFileResponse {
    // Helper method to create a response with files
    fn with_files(files: Vec<FileSchema>, page: usize, total: usize) -> Json<Self> {
        Json(Self {
            items: files,
            page,
            total,
        })
    }

    // Helper method to create an empty response
    fn empty(page: usize) -> Json<Self> {
        Json(Self {
            items: vec![],
            page,
            total: 0,
        })
    }

    // Helper method to handle database errors
    fn handle_error<T>(error: T, page: usize) -> Json<Self>
    where
        T: std::fmt::Display,
    {
        error!("Database error: {}", error);
        Self::empty(page)
    }
}

#[derive(FromForm)]
pub struct RandomQuery {
    #[field(default = 10)]
    pub size: usize,
    #[field(default = "*")]
    pub folder: String,
    #[field(default = "*")]
    pub tag: String,
    #[field(default = false)]
    pub equal: bool,
    #[field(default = 50)]
    pub equal_size: usize,
    #[field(default = "*")]
    pub root: String,
    #[field(default = "*")]
    pub extension: String,
}

#[get("/random/json?<query..>", format = "json")]
pub async fn random_json(conn: DbConn, query: RandomQuery) -> Json<JsonFileResponse> {
    if query.equal {
        match FileSchema::get_random_equal(
            &conn,
            query.size as i64,
            query.root.to_string(),
            query.equal_size as i64,
        )
        .await
        {
            Ok(files) => JsonFileResponse::with_files(files, 1, query.size),
            Err(e) => JsonFileResponse::handle_error(e, 1),
        }
    } else {
        match FileSchema::random(
            &conn,
            query.folder,
            query.size as i64,
            query.root.to_string(),
            query.tag.to_string(),
            query.extension,
        )
        .await
        {
            Ok(files) => JsonFileResponse::with_files(files, 1, query.size),
            Err(e) => JsonFileResponse::handle_error(e, 1),
        }
    }
}

#[get("/json?<folder>&<page>&<per_page>", format = "json")]
pub async fn get_all_files_json(
    conn: DbConn,
    page: Option<usize>,
    per_page: Option<usize>,
    folder: Option<&str>,
    state_files: &State<StateFiles>,
) -> Json<JsonFileResponse> {
    let current_page = page.unwrap_or(1);
    let items_per_page = per_page.unwrap_or(25);
    let folder_filter = folder.unwrap_or("*");

    let mut lock = state_files.files.lock().await;

    if let Some(folder_files) = lock.get(folder_filter) {
        if !folder_files.is_empty() {
            return JsonFileResponse::with_files(
                folder_files.clone(),
                current_page,
                folder_files.len(),
            );
        }
    }

    // Calculate offset (avoid underflow by checking page > 0)
    let offset = if current_page > 0 {
        (current_page - 1) * items_per_page
    } else {
        0
    };

    match FileSchema::all_paged(
        &conn,
        items_per_page as i64,
        offset as i64,
        folder_filter.to_string(),
    )
    .await
    {
        Ok(files) => {
            lock.entry(folder_filter.to_string())
                .or_insert_with(Vec::new)
                .extend(files.clone());
            JsonFileResponse::with_files(files.clone(), current_page, files.len())
        }
        Err(e) => JsonFileResponse::handle_error(e, current_page),
    }
}
