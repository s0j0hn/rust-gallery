use crate::DbConn;
use crate::constants::*;
use crate::error::AppResult;
use crate::models::file::repository::FileSchema;
use rocket::serde::json::Json;

#[get("/?<folder>")]
pub async fn get_all_tags(conn: DbConn, folder: Option<&str>) -> AppResult<Json<Vec<String>>> {
    let folder_param = folder.unwrap_or("*");

    // Validate folder parameter
    if folder_param.len() > MAX_FOLDER_NAME_LENGTH {
        return Err(crate::error::AppError::validation("Folder name too long"));
    }

    let all_tags = FileSchema::get_all_tags(&conn, folder_param.to_string()).await?;
    Ok(Json(all_tags))
}
