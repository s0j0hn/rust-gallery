use crate::models::file::repository::FileSchema;
use crate::{DbConn};
use rocket::serde::json::{Json};
use rocket::serde::Serialize;

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonFileResponse {
    items: Vec<FileSchema>,
    page: usize,
    total: usize,
}

#[get("/random/json?<size>&<folder>", format = "json")]
pub async fn random_json(
    conn: DbConn,
    size: Option<usize>,
    folder: Option<&str>,
) -> Option<Json<JsonFileResponse>> {
    let mut random_size = size.unwrap_or(0);
    if random_size <= 0 {
        random_size = 10
    }

    if random_size > 2000 {
        random_size = 2000
    }

    match FileSchema::random(&conn, folder.unwrap_or("*").to_string(), random_size as i64, "*".to_string(), "*".to_string(),  "*".to_string(), false, 0).await {
        Ok(files) => {
            let pimages = JsonFileResponse {
                items: files,
                page: 1,
                total: random_size,
            };

            Some(Json(pimages))
        }
        Err(e) => {
            error!("DB File::all() error: {e}");
            let pimages = JsonFileResponse {
                items: vec![],
                page: 1,
                total: 0,
            };

            Some(Json(pimages))
        }
    }
}

#[get("/json?<folder>&<page>&<per_page>", format = "json")]
pub async fn get_all_json(
    conn: DbConn,
    page: Option<usize>,
    per_page: Option<usize>,
    folder: Option<&str>,
) -> Option<Json<JsonFileResponse>> {
    let ppage = page.unwrap_or(1);
    let pper_page = per_page.unwrap_or(100);
    let mut offset = 0;

    if (ppage - 1) != 0 {
        offset = (ppage - 1) * pper_page;
    }

    match FileSchema::all_paged(
        &conn,
        pper_page as i64,
        offset as i64,
        folder.unwrap_or("*").to_string(),
    )
    .await
    {
        Ok(files) => {
            let pimages = JsonFileResponse {
                items: files.clone(),
                page: ppage,
                total: files.len(),
            };

            Some(Json(pimages))
        }
        Err(e) => {
            error!("DB File::all() error: {e}");
            let pimages = JsonFileResponse {
                items: vec![],
                page: ppage,
                total: 0,
            };

            Some(Json(pimages))
        }
    }
}

