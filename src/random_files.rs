use crate::{Context, DbConn,};
use rocket::request::FlashMessage;
use rocket_dyn_templates::Template;

#[get("/random?<size>&<folder>")]
pub async fn random(
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    size: Option<usize>,
    folder: Option<&str>,
) -> Template {
    let mut random_size = size.unwrap_or(0);
    if random_size <= 0 {
        random_size = 10
    }

    if random_size > 2000 {
        random_size = 2000
    }

    let flash = flash.map(FlashMessage::into_inner);

    Template::render(
        "random",
        Context::random(&conn, flash, &random_size, folder).await,
    )
}

