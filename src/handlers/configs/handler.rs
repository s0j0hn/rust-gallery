use crate::DbConn;
use crate::error::{AppError, AppResult};
use crate::models::config::repository::{ConfigInfo, ConfigSchema};
use rocket::serde::json::{Json, Value, json};
use rocket::serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct ConfigData {
    pub random_equal_folders: i32,
    pub photo_per_random: i32,
    pub folders_per_page: i32,
    pub equal_enabled: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonConfigDataResponse {
    random_equal_folders: i32,
    photo_per_random: i32,
    folders_per_page: i32,
    equal_enabled: bool,
}

#[post("/", format = "json", data = "<data>")]
pub async fn update_config(data: Json<ConfigData>, conn: DbConn) -> AppResult<Value> {
    // Validate config data
    if data.random_equal_folders <= 0 {
        return Err(AppError::validation(
            "random_equal_folders must be positive",
        ));
    }

    if data.photo_per_random <= 0 {
        return Err(AppError::validation("photo_per_random must be positive"));
    }

    if data.folders_per_page <= 0 {
        return Err(AppError::validation("folders_per_page must be positive"));
    }

    let c_data = ConfigInfo {
        random_equal_folders: data.random_equal_folders,
        photo_per_random: data.photo_per_random,
        folders_per_page: data.folders_per_page,
        equal_enabled: data.equal_enabled,
    };

    ConfigSchema::update(&conn, c_data.clone()).await?;

    Ok(json!({ "status": "ok", "config": c_data }))
}

#[get("/")]
pub async fn get_config(conn: DbConn) -> AppResult<Json<JsonConfigDataResponse>> {
    let config_data = ConfigSchema::get_config(&conn).await?;

    Ok(Json(JsonConfigDataResponse {
        photo_per_random: config_data.photo_per_random,
        folders_per_page: config_data.folders_per_page,
        random_equal_folders: config_data.random_equal_folders,
        equal_enabled: config_data.equal_enabled,
    }))
}
