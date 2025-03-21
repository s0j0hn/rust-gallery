use crate::models::file::repository::FileSchema;
use crate::DbConn;
use rocket::form::Form;
use rocket::response::{Flash, Redirect};
use rocket::serde::json::Json;

#[derive(Debug, FromForm)]
pub struct FileTags {
    #[field(validate = len(15..))]
    pub file_hash: String,
    #[field(validate = len(1..))]
    pub tags: Vec<String>,
}

#[post("/tags", data = "<tags_form>")]
pub async fn add_tags(tags_form: Form<FileTags>, conn: DbConn) -> Flash<Redirect> {
    let file_tags_form = tags_form.into_inner();
    if file_tags_form.tags.is_empty() {
        Flash::error(Redirect::to("/"), "Tags cannot be empty.")
    } else if let Err(e) =
        FileSchema::add_tags(&conn, file_tags_form.file_hash, file_tags_form.tags.clone()).await
    {
        error!("DB insertion error: {e}");
        Flash::error(
            Redirect::to("/"),
            "Tags could not be inserted due an internal error.",
        )
    } else {
        Flash::success(Redirect::to("/"), "Tags successfully added.")
    }
}

#[get("/?<folder>")]
pub async fn get_all_tags(conn: DbConn, folder: Option<&str>) -> Json<Vec<String>> {
    let all_tags = FileSchema::get_all_tags(&conn, folder.unwrap_or("*").to_string()).await;
    match all_tags {
        Ok(tags) => Json(tags),
        Err(e) => Json(vec![e.to_string()]),
    }
}
