use crate::models::file::repository::FileSchema;
use crate::DbConn;
use rocket::serde::json::{Json};
use rocket::serde::Serialize;

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonFileResponse {
    items: Vec<FileSchema>,
    page: usize,
    total: usize,
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
        T: std::fmt::Display
    {
        error!("Database error: {}", error);
        Self::empty(page)
    }
}

// Normalize size with constraints
fn normalize_size(size: Option<usize>, min: usize, max: usize) -> usize {
    size.unwrap_or(min).clamp(min, max)
}

#[get("/random/json?<size>&<folder>", format = "json")]
pub async fn random_json(
    conn: DbConn,
    size: Option<usize>,
    folder: Option<&str>,
) -> Json<JsonFileResponse> {
    // Normalize size with constraints (default: 10, min: 1, max: 2000)
    let random_size = normalize_size(size, 10, 2000);
    let folder_filter = folder.unwrap_or("*");

    // Default values for optional parameters
    const DEFAULT_FILTER: &str = "*";
    const EQUAL_FLAG: bool = false;
    const FOLDERS_SIZE: i64 = 0;

    match FileSchema::random(
        &conn,
        folder_filter.to_string(),
        random_size as i64,
        DEFAULT_FILTER.to_string(),
        DEFAULT_FILTER.to_string(),
        DEFAULT_FILTER.to_string(),
        EQUAL_FLAG,
        FOLDERS_SIZE
    ).await {
        Ok(files) => JsonFileResponse::with_files(files, 1, random_size),
        Err(e) => JsonFileResponse::handle_error(e, 1),
    }
}

#[get("/json?<folder>&<page>&<per_page>", format = "json")]
pub async fn get_all_json(
    conn: DbConn,
    page: Option<usize>,
    per_page: Option<usize>,
    folder: Option<&str>,
) -> Json<JsonFileResponse> {
    let current_page = page.unwrap_or(1);
    let items_per_page = per_page.unwrap_or(100);
    let folder_filter = folder.unwrap_or("*");

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
    ).await {
        Ok(files) => JsonFileResponse::with_files(files.clone(), current_page, files.len()),
        Err(e) => JsonFileResponse::handle_error(e, current_page),
    }
}