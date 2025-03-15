// use rocket::futures::future::join_all;
use crate::cache_files::StateFiles;
use crate::models::file::repository::FileSchema;
use crate::{Context, DbConn};
use rocket::State;
use rocket::request::FlashMessage;
use rocket::serde::json::{Json, Value, json};
use rocket::serde::{Deserialize, Serialize};
use rocket_dyn_templates::Template;

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

// Helper function for creating API responses
fn create_response<T, E: std::fmt::Display>(result: &Result<T, E>, success_value: Value) -> Value {
    match result {
        Ok(_) => success_value,
        Err(e) => {
            error!("API error: {e}");
            json!({ "status": "error", "message": format!("{}", e) })
        }
    }
}

#[post("/assign", format = "json", data = "<data>")]
pub async fn assign_tag(conn: DbConn, data: Json<TagAssign>) -> Value {
    let result = FileSchema::add_tags(&conn, data.image_hash.clone(), data.tags.clone()).await;
    create_response(&result, json!({ "status": "ok", "tags": data.tags }))
}

#[post("/delete", format = "json", data = "<data>")]
pub async fn delete_folder(conn: DbConn, data: Json<DeleteFolder>) -> Value {
    let result = FileSchema::delete_folder_with_name(data.folder_name.clone(), &conn).await;

    // Extract the row count before passing the result to create_response
    let affected_rows = result.as_ref().map_or(0, |count| *count);

    create_response(&result, json!({ "status": "ok", "rows": affected_rows }))
}

#[post("/assign/folder", format = "json", data = "<data>")]
pub async fn assign_tag_folder(conn: DbConn, data: Json<TagFolderAssign>) -> Value {
    let result =
        FileSchema::add_tags_folder(&conn, data.folder_name.clone(), data.tags.clone()).await;
    create_response(&result, json!({ "status": "ok", "tags": data.tags }))
}

#[get("/?<folder>")]
pub async fn get_folders(
    state_files: &State<StateFiles>,
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    folder: &str,
) -> Template {
    let flash = flash.map(FlashMessage::into_inner);

    Template::render(
        "files",
        Context::get_all_folders(&conn, flash, Some(folder), state_files).await,
    )
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
) -> Json<Vec<JsonFolderResponse>> {
    let current_page = page.unwrap_or(1);
    let items_per_page = per_page.unwrap_or(25);
    // Calculate offset (avoid underflow by checking page > 0)
    let offset = if current_page > 0 {
        (current_page - 1) * items_per_page
    } else {
        0
    };

    // Default to "_" if parameters are not provided
    let search_term = searchby.unwrap_or("_");

    // Format search patterns for both search and root
    let search_pattern = format_search_pattern(search_term);

    match FileSchema::get_folders(
        &conn,
        search_pattern,
        root.to_string(),
        items_per_page as i64,
        offset as i64,
    )
    .await
    {
        Ok(folders) => {
            // Map folders to response objects with tags
            let response: Vec<JsonFolderResponse> = folders
                .into_iter()
                .map(|f| JsonFolderResponse {
                    title: f.folder_name.clone(),
                    photo_count: f.count as usize,
                    tags: vec![],
                    root: f.root,
                })
                .collect();
            Json(response)
        }
        Err(e) => {
            error!("Error retrieving folders: {e}");
            Json(Vec::new()) // Return empty array on error
        }
    }
}

#[get("/roots")]
pub async fn get_roots_json(conn: DbConn) -> Json<Vec<JsonRootResponse>> {
    match FileSchema::get_folders_roots(&conn).await {
        Ok(roots) => {
            // Map folders to response objects with tags
            let response: Vec<JsonRootResponse> = roots
                .into_iter()
                .map(|r| JsonRootResponse {
                    root: r.root,
                    photo_count: r.count as usize,
                    folder_count: r.f_count as usize,
                })
                .collect();
            Json(response)
        }
        Err(e) => {
            error!("Error retrieving roots: {e}");
            Json(Vec::new()) // Return empty array on error
        }
    }
}

#[get("/json/name/<name>")]
pub async fn get_folder_by_name(conn: DbConn, name: &str) -> Json<Vec<JsonFolderResponse>> {
    match FileSchema::get_folder_by_name(&conn, name.to_string()).await {
        Ok(folders) => {
            // Map folders to response objects with tags
            let response: Vec<JsonFolderResponse> = folders
                .into_iter()
                .map(|f| JsonFolderResponse {
                    title: f.folder_name.clone(),
                    photo_count: f.count as usize,
                    tags: vec![],
                    root: f.root,
                })
                .collect();
            Json(response)
        }
        Err(e) => {
            error!("Error retrieving folders: {e}");
            Json(Vec::new()) // Return empty array on error
        }
    }
}

// Helper function to format search pattern
fn format_search_pattern(pattern: &str) -> String {
    if pattern.starts_with('%') && pattern.ends_with('%') {
        // Remove percent signs if they're already there
        pattern.trim_matches('%').to_string()
    } else {
        // Add percent signs for SQL LIKE pattern
        format!("%{}%", pattern)
    }
}

#[get("/?<searchby>&<root>")]
pub async fn retrieve_folders(
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    searchby: Option<&str>,
    root: Option<&str>,
) -> Template {
    let flash = flash.map(FlashMessage::into_inner);

    // Default to "_" if parameters are not provided
    let search_term = searchby.unwrap_or("_");
    let root_term = root.unwrap_or("_");

    // Format search patterns for both search and root
    let search_pattern = format_search_pattern(search_term);
    let root_pattern = format_search_pattern(root_term);

    Template::render(
        "index",
        Context::get_folders(&conn, flash, &search_pattern, &root_pattern).await,
    )
}
