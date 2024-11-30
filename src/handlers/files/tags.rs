use rocket::form::Form;
use rocket::response::{Flash, Redirect};
use crate::DbConn;
use crate::models::file::repository::FileSchema;

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
        Flash::error(Redirect::to("/folders"), "Tags cannot be empty.")
    } else if let Err(e) =
        FileSchema::add_tags(&conn, file_tags_form.file_hash, file_tags_form.tags.clone()).await
    {
        error!("DB insertion error: {e}");
        Flash::error(
            Redirect::to("/folders"),
            "Tags could not be inserted due an internal error.",
        )
    } else {
        Flash::success(Redirect::to("/folders"), "Tags successfully added.")
    }
}