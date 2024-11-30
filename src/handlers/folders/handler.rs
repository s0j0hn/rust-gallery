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

#[post("/assign", format = "json", data = "<data>")]
pub async fn assign_tag(conn: DbConn, data: Json<TagAssign>) -> Value {
    match FileSchema::add_tags(&conn, data.image_hash.clone(), data.tags.clone()).await {
        Ok(_) => {
            json!({ "status": "ok", "tags": data.tags })
        }
        Err(e) => {
            error!("Adding tags error: {e}");
            json!({ "status": "error" })
        }
    }
}

#[post("/delete", format = "json", data = "<data>")]
pub async fn delete_folder(conn: DbConn, data: Json<DeleteFolder>) -> Value {
    match FileSchema::delete_folder_with_name(data.folder_name.clone(), &conn).await {
        Ok(rows) => {
            json!({ "status": "ok", "rows": rows })
        }
        Err(e) => {
            error!("Adding tags error: {e}");
            json!({ "status": "error" })
        }
    }
}

#[post("/assign/folder", format = "json", data = "<data>")]
pub async fn assign_tag_folder(conn: DbConn, data: Json<TagFolderAssign>) -> Value {
    match FileSchema::add_tags_folder(&conn, data.folder_name.clone(), data.tags.clone()).await {
        Ok(_) => {
            json!({ "status": "ok", "tags": data.tags })
        }
        Err(e) => {
            error!("Adding tags error: {e}");
            json!({ "status": "error" })
        }
    }
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

#[get("/?<searchby>&<root>")]
pub async fn retrieve_folders(
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    searchby: Option<&str>,
    root: Option<&str>,
) -> Template {
    let flash = flash.map(FlashMessage::into_inner);
    let search_b = searchby.unwrap_or("_");
    let root = root.unwrap_or("_");

    match search_b.starts_with("%") && search_b.ends_with("%") {
        true => {
            let search_bs = &search_b.replace("%", "");
            let root_by = &root.replace("%", "");

            Template::render(
                "index",
                Context::get_folders(&conn, flash, search_bs, root_by).await,
            )
        }
        false => {
            let search_by = "%".to_owned() + search_b + "%";
            let root_by = "%".to_owned() + root + "%";

            Template::render(
                "index",
                Context::get_folders(&conn, flash, &search_by, &root_by).await,
            )
        }
    }
}