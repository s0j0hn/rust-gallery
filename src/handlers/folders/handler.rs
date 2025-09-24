use crate::DbConn;
use crate::constants::*;
use crate::error::{AppError, AppResult};
use crate::models::file::repository::FileSchema;
use rocket::serde::json::{Json, Value, json};
use rocket::serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct TagAssign {
    image_hash: String,
    tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct TagFolderAssign {
    folder_name: String,
    tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct DeleteFolder {
    folder_name: String,
}

#[post("/assign", format = "json", data = "<data>")]
pub async fn assign_tag(conn: DbConn, data: Json<TagAssign>) -> AppResult<Value> {
    // Validate input
    if data.image_hash.is_empty() {
        return Err(AppError::validation("Image hash cannot be empty"));
    }

    if data.tags.is_empty() {
        return Err(AppError::validation("At least one tag must be provided"));
    }

    // Check if file exists
    FileSchema::get_by_hash(data.image_hash.clone(), &conn).await?;

    // Add tags
    FileSchema::add_tags(&conn, data.image_hash.clone(), data.tags.clone()).await?;

    Ok(json!({ "status": "ok", "tags": data.tags }))
}

#[post("/delete", format = "json", data = "<data>")]
pub async fn delete_folder(conn: DbConn, data: Json<DeleteFolder>) -> AppResult<Value> {
    if data.folder_name.is_empty() {
        return Err(AppError::validation("Folder name cannot be empty"));
    }

    let affected_rows =
        FileSchema::delete_folder_with_name(data.folder_name.clone(), &conn).await?;

    Ok(json!({ "status": "ok", "rows": affected_rows }))
}

#[post("/assign/folder", format = "json", data = "<data>")]
pub async fn assign_tag_folder(conn: DbConn, data: Json<TagFolderAssign>) -> AppResult<Value> {
    // Validate input
    if data.folder_name.is_empty() {
        return Err(AppError::validation("Folder name cannot be empty"));
    }

    if data.tags.is_empty() {
        return Err(AppError::validation("At least one tag must be provided"));
    }

    FileSchema::add_tags_folder(&conn, data.folder_name.clone(), data.tags.clone()).await?;
    Ok(json!({ "status": "ok", "tags": data.tags }))
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonFolderResponse {
    title: String,
    photo_count: usize,
    tags: Vec<String>,
    root: String,
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonRootResponse {
    root: String,
    photo_count: usize,
    folder_count: usize,
}

#[get("/json?<searchby>&<root>&<page>&<per_page>")]
pub async fn get_folders_json(
    conn: DbConn,
    root: &str,
    searchby: Option<&str>,
    page: Option<usize>,
    per_page: Option<usize>,
) -> AppResult<Json<Vec<JsonFolderResponse>>> {
    let current_page = page.unwrap_or(DEFAULT_PAGE);
    let items_per_page = per_page.unwrap_or(DEFAULT_ITEMS_PER_PAGE);

    // Validate pagination
    if current_page == 0 {
        return Err(AppError::validation("Page must be greater than 0"));
    }

    if items_per_page > MAX_ITEMS_PER_PAGE {
        return Err(AppError::validation(&format!(
            "Items per page cannot exceed {}",
            MAX_ITEMS_PER_PAGE
        )));
    }

    let offset = (current_page - 1) * items_per_page;
    let search_term = searchby.unwrap_or("*");
    let search_pattern = if search_term == "*" {
        "%".to_string() // Match all folders when no search term is provided
    } else {
        format_search_pattern(search_term)
    };

    let folders = FileSchema::get_folders(
        &conn,
        search_pattern,
        root.to_string(),
        items_per_page as i64,
        offset as i64,
    )
    .await?;

    let response: Vec<JsonFolderResponse> = folders
        .into_iter()
        .map(|f| JsonFolderResponse {
            title: f.folder_name.clone(),
            photo_count: f.count as usize,
            tags: vec![],
            root: f.root,
        })
        .collect();

    Ok(Json(response))
}

#[get("/roots")]
pub async fn get_roots_json(conn: DbConn) -> AppResult<Json<Vec<JsonRootResponse>>> {
    let roots = FileSchema::get_folders_roots(&conn).await?;

    // Map folders to response objects
    let response: Vec<JsonRootResponse> = roots
        .into_iter()
        .map(|r| JsonRootResponse {
            root: r.root,
            photo_count: r.count as usize,
            folder_count: r.f_count as usize,
        })
        .collect();

    Ok(Json(response))
}

#[get("/json/name/<name>")]
pub async fn get_folder_by_name(
    conn: DbConn,
    name: &str,
) -> AppResult<Json<Vec<JsonFolderResponse>>> {
    // Validate name parameter
    if name.is_empty() {
        return Err(AppError::validation("Folder name cannot be empty"));
    }

    if name.len() > MAX_FOLDER_NAME_LENGTH {
        return Err(AppError::validation("Folder name too long"));
    }

    // Check for directory traversal attempts
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err(AppError::bad_request(
            "Invalid folder name: contains forbidden characters",
        ));
    }

    let folders = FileSchema::get_folder_by_name(&conn, name.to_string()).await?;

    // Map folders to response objects
    let response: Vec<JsonFolderResponse> = folders
        .into_iter()
        .map(|f| JsonFolderResponse {
            title: f.folder_name.clone(),
            photo_count: f.count as usize,
            tags: vec![],
            root: f.root,
        })
        .collect();

    Ok(Json(response))
}

// Helper function to format search pattern safely
fn format_search_pattern(pattern: &str) -> String {
    // Sanitize the input by escaping SQL LIKE metacharacters
    let sanitized = pattern.replace('%', "\\%").replace('_', "\\_");

    if sanitized.starts_with("\\%") && sanitized.ends_with("\\%") {
        // Remove escaped percent signs if they're already there
        sanitized
            .trim_start_matches("\\%")
            .trim_end_matches("\\%")
            .to_string()
    } else {
        // Add percent signs for SQL LIKE pattern
        format!("%{sanitized}%")
    }
}
