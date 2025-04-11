use crate::DbConn;
use crate::models::file::repository::FileSchema;
use rocket::serde::json::Json;

#[get("/?<folder>")]
pub async fn get_all_tags(conn: DbConn, folder: Option<&str>) -> Json<Vec<String>> {
    let all_tags = FileSchema::get_all_tags(&conn, folder.unwrap_or("*").to_string()).await;
    match all_tags {
        Ok(tags) => Json(tags),
        Err(e) => Json(vec![e.to_string()]),
    }
}
