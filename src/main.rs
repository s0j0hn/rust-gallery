#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_sync_db_pools;

mod cache_files;
mod context;
#[cfg(test)]
mod tests;
mod models;
mod handlers;

use crate::handlers::files::files_download::{get_thumbnail_folder, retrieve_file};
use crate::handlers::files::files_index::{get_files_by_extension, get_files_by_tag, index_files};
use crate::handlers::files::tags::add_tags;
use crate::handlers::folders::handler::{assign_tag, assign_tag_folder, delete_folder, get_folders, retrieve_folders};
use crate::handlers::json::random_files_json::{get_all_json, random_json};
use crate::handlers::tasks::task_manager::{cancel_task, ThreadManager};
use crate::models::file::repository::{FileSchema, FolderInfo};
use cache_files::{ImageCache, StateFiles};
use handlers::files::random_files::random;
use moka::sync::Cache;
use rocket::fairing::AdHoc;
use rocket::fs::{relative, FileServer, Options};
use rocket::request::FlashMessage;
use rocket::serde::{Deserialize, Serialize};
use rocket::{Build, Rocket};
use rocket_dyn_templates::Template;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

#[database("sqlite_database")]
pub struct DbConn(diesel::SqliteConnection);

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct Context {
    flash: Option<(String, String)>,
    files: Vec<FileSchema>,
    folders: Vec<FolderInfo>,
    count_files: i64,
    roots: Vec<String>,
    tags: Vec<String>,
}

async fn run_migrations(rocket: Rocket<Build>) -> Rocket<Build> {
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

    const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

    DbConn::get_one(&rocket)
        .await
        .expect("database connection")
        .run(|conn| {
            conn.run_pending_migrations(MIGRATIONS)
                .expect("diesel migrations");
        })
        .await;

    rocket
}

#[get("/?<searchby>&<root>")]
async fn beta_index(
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
                "beta",
                Context::get_folders(&conn, flash, search_bs, root_by).await,
            )
        }
        false => {
            let search_by = "%".to_owned() + search_b + "%";
            let root_by = "%".to_owned() + root + "%";

            Template::render(
                "beta",
                Context::get_folders(&conn, flash, &search_by, &root_by).await,
            )
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    images_dirs: Vec<String>,
}

#[launch]
fn rocket() -> _ {
    let options = Options::Index | Options::DotFiles;
    let cache: ImageCache = Arc::new(
        Cache::builder()
            .time_to_live(Duration::from_secs(345600)) // 24h
            .build(),
    );
    let thread_manager = ThreadManager::new();

    rocket::build()
        .manage(StateFiles {
            files: HashMap::new().into(),
        })
        .manage(cache)
        .manage(thread_manager)
        .attach(AdHoc::config::<AppConfig>())
        .attach(DbConn::fairing())
        .attach(Template::fairing())
        .attach(AdHoc::on_ignite("Run Migrations", run_migrations))
        .mount("/", FileServer::new(relative!("static"), options))
        .mount("/beta", routes![beta_index])
        .mount("/tags", routes![assign_tag, assign_tag_folder])
        .mount(
            "/files",
            routes![
                add_tags,
                get_folders,
                index_files,
                cancel_task,
                retrieve_file,
                random,
                random_json,
                get_all_json,
                get_files_by_tag,
                get_files_by_extension
            ],
        )
        .mount("/folders", routes![retrieve_folders, get_thumbnail_folder, delete_folder])
}
