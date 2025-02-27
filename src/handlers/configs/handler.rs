use crate::models::config::repository::{ConfigInfo, ConfigSchema};
use crate::{DbConn};
use rocket::serde::json::{json, Json, Value};
use rocket::serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct ConfigData {
    pub random_equal_folders: i32,
}

#[post("/", format = "json", data = "<data>")]
pub async fn update_config(data: Json<ConfigData>, conn: DbConn) -> Value {
    let c_data = ConfigInfo {
        random_equal_folders: data.random_equal_folders,
    };
    match ConfigSchema::update(&conn, c_data.clone()).await {
        Ok(_) => {
            json!({ "status": "ok", "config": c_data })
        }
        Err(e) => {
            error!("Adding tags error: {e}");
            json!({ "status": "error" })
        }
    }
}