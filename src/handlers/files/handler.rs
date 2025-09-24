use crate::DbConn;
use crate::cache_files::{CachedImage, ImageCache, StateFiles};
use crate::constants::*;
use crate::error::{AppError, AppResult};
use crate::handlers::files::utils::{
    create_cached_image, create_image_buffer, read_file_to_buffer,
};
use crate::logging::cache_logging;
use crate::models::file::repository::FileSchema;
use rocket::State;
use rocket::form::FromForm;
use rocket::serde::Serialize;
use rocket::serde::json::Json;
use std::path::Path;
use tracing::{info, warn, debug, instrument};

#[get("/<hash>/download?<width>&<height>")]
#[instrument(skip(conn), fields(hash = %hash, width = ?width, height = ?height))]
pub async fn retrieve_file(
    hash: &str,
    conn: DbConn,
    width: Option<usize>,
    height: Option<usize>,
) -> AppResult<CachedImage> {
    // Validate hash format - ensure it's alphanumeric and reasonable length
    if !hash.chars().all(|c| c.is_alphanumeric())
        || hash.len() < MIN_HASH_LENGTH
        || hash.len() > MAX_HASH_LENGTH
    {
        warn!(hash = %hash, "Invalid hash format provided");
        return Err(AppError::bad_request("Invalid hash format"));
    }

    debug!("Fetching file metadata from database");
    // Fetch from database with proper error handling
    let f_schema = FileSchema::get_by_hash(hash.to_string(), &conn).await?;

    // Check if file exists on disk
    if !Path::new(&f_schema.path).exists() {
        warn!(path = %f_schema.path, hash = %hash, "File not found on disk");
        return Err(AppError::not_found("File"));
    }

    info!(
        file_name = %f_schema.filename,
        file_path = %f_schema.path,
        original_size = %format!("{}x{}", f_schema.width, f_schema.height),
        "File located, processing request"
    );

    // Check if resizing is needed
    if let (Some(image_width), Some(image_height)) = (width, height) {
        if image_width as i32 > f_schema.width || image_height as i32 > f_schema.height {
            let img = image::open(&f_schema.path)?;
            let resized_img = img.resize(
                image_width as u32,
                image_height as u32,
                image::imageops::FilterType::Lanczos3,
            );
            let buffer = create_image_buffer(&f_schema, &resized_img)?;
            return Ok(create_cached_image(buffer, &f_schema.extension, 86400));
        }
    }

    // Return the original file
    let buffer = read_file_to_buffer(&f_schema.path)?;
    Ok(create_cached_image(buffer, &f_schema.extension, 86400))
}

#[get("/thumbnail/folder/download?<folder>&<width>&<height>&<number>")]
pub async fn get_thumbnail_folder(
    conn: DbConn,
    folder: &str,
    number: Option<usize>,
    width: Option<usize>,
    height: Option<usize>,
    cache: &State<ImageCache>,
) -> AppResult<CachedImage> {
    // Validate folder name - prevent directory traversal and empty names
    if folder.is_empty() || folder.len() > MAX_FOLDER_NAME_LENGTH {
        return Err(AppError::bad_request("Invalid folder name"));
    }

    // Check for directory traversal attempts
    if folder.contains("..") || folder.contains('/') || folder.contains('\\') {
        return Err(AppError::bad_request(
            "Invalid folder name: contains forbidden characters",
        ));
    }

    let cache_key = format!("thumb_{}_{}", folder, number.unwrap_or(1));

    // Return cached thumbnail if available
    if let Some(data) = cache.get(&cache_key) {
        cache_logging::log_cache_hit(&cache_key, "thumbnail_folder");
        let extension = "jpg";
        return Ok(create_cached_image(data, extension, 604800));
    }
    cache_logging::log_cache_miss(&cache_key, "thumbnail_folder");

    // Get random file from folder
    let file_schema_vec = FileSchema::random(
        &conn,
        folder.to_string(),
        1,
        "*".to_string(),
        "*".to_string(),
        "*".to_string(),
    )
    .await?;

    let f_schema = file_schema_vec
        .first()
        .ok_or_else(|| AppError::not_found("Files in folder"))?;

    let image_width = width.unwrap_or(DEFAULT_THUMBNAIL_WIDTH as usize) as u32;
    let image_height = height.unwrap_or(DEFAULT_THUMBNAIL_HEIGHT as usize) as u32;

    // Check if file exists before attempting to open
    if !Path::new(&f_schema.path).exists() {
        return Err(AppError::not_found("File on disk"));
    }

    // Generate thumbnail
    if image_width as i32 <= f_schema.width || image_height as i32 <= f_schema.height {
        let img = image::open(&f_schema.path)?;
        let resized_img = img.resize(
            image_width,
            image_height,
            image::imageops::FilterType::Lanczos3,
        );

        let buffer = create_image_buffer(f_schema, &resized_img)?;
        cache_logging::log_cache_set(&cache_key, "thumbnail_folder", Some(604800));
        cache.insert(cache_key, buffer.clone());
        return Ok(create_cached_image(buffer, &f_schema.extension, 604800));
    }

    // Return original file if no resizing needed
    let buffer = read_file_to_buffer(&f_schema.path)?;
    Ok(create_cached_image(buffer, &f_schema.extension, 604800))
}

#[get("/thumbnail/photo/download?<hash>&<width>&<height>")]
pub async fn get_thumbnail_photo(
    conn: DbConn,
    hash: &str,
    width: Option<usize>,
    height: Option<usize>,
    cache: &State<ImageCache>,
) -> AppResult<CachedImage> {
    let cache_key = format!("thumb_{hash}");

    // Validate hash format - ensure it's alphanumeric and reasonable length
    if !hash.chars().all(|c| c.is_alphanumeric())
        || hash.len() < MIN_HASH_LENGTH
        || hash.len() > MAX_HASH_LENGTH
    {
        return Err(AppError::bad_request("Invalid hash format"));
    }

    // Return cached thumbnail if available
    if let Some(data) = cache.get(&cache_key) {
        cache_logging::log_cache_hit(&cache_key, "thumbnail_photo");
        let extension = "jpg";
        return Ok(create_cached_image(data, extension, 604800));
    }
    cache_logging::log_cache_miss(&cache_key, "thumbnail_photo");

    // Get file from database
    let f_schema = FileSchema::get_by_hash(hash.to_string(), &conn).await?;

    let image_width = width.unwrap_or(DEFAULT_THUMBNAIL_WIDTH as usize) as u32;
    let image_height = height.unwrap_or(DEFAULT_THUMBNAIL_HEIGHT as usize) as u32;

    // Check if file exists before attempting to open
    if !Path::new(&f_schema.path).exists() {
        return Err(AppError::not_found("File on disk"));
    }

    // Generate thumbnail
    if image_width as i32 <= f_schema.width || image_height as i32 <= f_schema.height {
        let img = image::open(&f_schema.path)?;
        let resized_img = img.resize(
            image_width,
            image_height,
            image::imageops::FilterType::Lanczos3,
        );

        let buffer = create_image_buffer(&f_schema, &resized_img)?;
        cache_logging::log_cache_set(&cache_key, "thumbnail_photo", Some(604800));
        cache.insert(cache_key, buffer.clone());
        return Ok(create_cached_image(buffer, &f_schema.extension, 604800));
    }

    // Return original file if no resizing needed
    let buffer = read_file_to_buffer(&f_schema.path)?;
    Ok(create_cached_image(buffer, &f_schema.extension, 604800))
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
}

#[derive(FromForm)]
pub struct RandomQuery {
    #[field(default = DEFAULT_RANDOM_SIZE)]
    pub size: usize,
    #[field(default = "*")]
    pub folder: String,
    #[field(default = "*")]
    pub tag: String,
    #[field(default = false)]
    pub equal: bool,
    #[field(default = DEFAULT_EQUAL_SIZE)]
    pub equal_size: usize,
    #[field(default = "*")]
    pub root: String,
    #[field(default = "*")]
    pub extension: String,
}

#[get("/random/json?<query..>", format = "json")]
pub async fn random_json(conn: DbConn, query: RandomQuery) -> AppResult<Json<JsonFileResponse>> {
    // Validate query parameters
    if query.size == 0 {
        return Err(AppError::validation("Size must be greater than 0"));
    }

    if query.size > MAX_PAGINATION_SIZE {
        return Err(AppError::validation(&format!(
            "Size cannot exceed {}",
            MAX_PAGINATION_SIZE
        )));
    }

    let files = if query.equal {
        FileSchema::get_random_equal(
            &conn,
            query.size as i64,
            query.root.to_string(),
            query.equal_size as i64,
        )
        .await?
    } else {
        FileSchema::random(
            &conn,
            query.folder,
            query.size as i64,
            query.root.to_string(),
            query.tag.to_string(),
            query.extension,
        )
        .await?
    };

    Ok(Json(JsonFileResponse {
        items: files,
        page: DEFAULT_PAGE,
        total: query.size,
    }))
}

#[get("/json?<folder>&<page>&<per_page>", format = "json")]
pub async fn get_all_files_json(
    conn: DbConn,
    page: Option<usize>,
    per_page: Option<usize>,
    folder: Option<&str>,
    state_files: &State<StateFiles>,
) -> AppResult<Json<JsonFileResponse>> {
    let current_page = page.unwrap_or(DEFAULT_PAGE);
    let items_per_page = per_page.unwrap_or(DEFAULT_ITEMS_PER_PAGE);
    let folder_filter = folder.unwrap_or("*");

    // Validate pagination parameters
    if current_page == 0 {
        return Err(AppError::validation("Page must be greater than 0"));
    }

    if items_per_page > MAX_ITEMS_PER_PAGE {
        return Err(AppError::validation(&format!(
            "Items per page cannot exceed {}",
            MAX_ITEMS_PER_PAGE
        )));
    }

    // Validate folder parameter
    if let Some(folder_param) = folder {
        if folder_param.len() > MAX_FOLDER_NAME_LENGTH {
            return Err(AppError::validation("Folder name too long"));
        }
    }

    let mut lock = state_files.files.lock().await;

    if let Some(folder_files) = lock.get(folder_filter) {
        if !folder_files.is_empty() {
            return Ok(JsonFileResponse::with_files(
                folder_files.clone(),
                current_page,
                folder_files.len(),
            ));
        }
    }

    // Calculate offset
    let offset = (current_page - 1) * items_per_page;

    let files = FileSchema::all_paged(
        &conn,
        items_per_page as i64,
        offset as i64,
        folder_filter.to_string(),
    )
    .await?;

    lock.entry(folder_filter.to_string())
        .or_insert_with(Vec::new)
        .extend(files.clone());

    Ok(JsonFileResponse::with_files(
        files.clone(),
        current_page,
        files.len(),
    ))
}
