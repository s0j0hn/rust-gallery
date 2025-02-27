use rocket::serde::json::{json, Json, Value};
use rocket::serde::{Deserialize, Serialize};
use rocket::State;
use rocket::request::FlashMessage;
use rocket_dyn_templates::Template;
use crate::cache_files::StateFiles;
use crate::{Context, DbConn};
use crate::models::file::repository::FileSchema;

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
    let result = FileSchema::add_tags_folder(&conn, data.folder_name.clone(), data.tags.clone()).await;
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