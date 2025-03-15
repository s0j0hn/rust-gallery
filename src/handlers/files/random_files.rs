use crate::{Context, DbConn};
use rocket::request::FlashMessage;
use rocket_dyn_templates::Template;

#[get("/random?<size>&<folder>&<root>&<equal>&<folders_size>")]
pub async fn random(
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    size: Option<usize>,
    folder: Option<&str>,
    root: Option<&str>,
    equal: Option<&str>,
    folders_size: Option<usize>,
) -> Template {
    let mut random_size = size.unwrap_or(0);
    let random_folder_size = folders_size.unwrap_or(0);

    if random_size > 2000 {
        random_size = 2000
    }

    let flash = flash.map(FlashMessage::into_inner);

    let equal_value = matches!(equal.unwrap_or("false"), "true" | "t" | "1");

    Template::render(
        "random",
        Context::random(
            &conn,
            flash,
            &random_size,
            folder,
            root,
            None,
            None,
            &equal_value,
            &random_folder_size,
        )
        .await,
    )
}
