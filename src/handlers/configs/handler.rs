use crate::DbConn;
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
pub async fn update_config(data: Json<ConfigData>, conn: DbConn) -> Value {
    let c_data = ConfigInfo {
        random_equal_folders: data.random_equal_folders,
        photo_per_random: data.photo_per_random,
        folders_per_page: data.folders_per_page,
        equal_enabled: data.equal_enabled,
    };
    match ConfigSchema::update(&conn, c_data.clone()).await {
        Ok(_) => {
            json!({ "status": "ok", "config": c_data })
        }
        Err(e) => {
            error!("Updating config error: {e}");
            json!({ "status": "error", "error": format!("{}", e) })
        }
    }
}

#[get("/")]
pub async fn get_config(conn: DbConn) -> Json<JsonConfigDataResponse> {
    match ConfigSchema::get_config(&conn).await {
        Ok(config_data) => Json(JsonConfigDataResponse {
            photo_per_random: config_data.photo_per_random,
            folders_per_page: config_data.folders_per_page,
            random_equal_folders: config_data.random_equal_folders,
            equal_enabled: config_data.equal_enabled,
        }),
        Err(e) => {
            error!("Getting config error: {e}");
            Json(JsonConfigDataResponse {
                photo_per_random: 300,
                folders_per_page: 16,
                random_equal_folders: 25,
                equal_enabled: false,
            })
        }
    }
}
