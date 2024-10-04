#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_sync_db_pools;

mod file_schema;
mod files_index;
mod random_files;

#[cfg(test)]
mod tests;
mod random_files_json;
mod files_download;
mod cache_files;
mod task_manager;
mod context;

use crate::file_schema::{FileSchema, FolderCount};
use crate::random_files::random;
use crate::random_files_json::{get_all_json, random_json};
use moka::sync::Cache;
use rocket::fairing::AdHoc;
use rocket::fs::{relative, FileServer, Options};
use rocket::request::FlashMessage;
use rocket::serde::{Deserialize, Serialize};
use rocket::{Build, Rocket, State};
use rocket_dyn_templates::Template;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{Ordering};
use std::time::Duration;
use cache_files::{ImageCache, StateFiles};
use task_manager::ThreadManager;
use crate::files_download::{get_thumbnail_folder, retrieve_file};


#[database("sqlite_database")]
pub struct DbConn(diesel::SqliteConnection);

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct Context {
    flash: Option<(String, String)>,
    files: Vec<FileSchema>,
    folders: Vec<FolderCount>,
    count_files: i64,
    roots: Vec<String>,
    tags: Vec<String>,
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct JsonFileResponse {
    items: Vec<FileSchema>,
    page: usize,
    total: usize,
}

#[get("/?<folder>")]
async fn index(
    state_files: &State<StateFiles>,
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    folder: &str,
) -> Template {
    let flash = flash.map(FlashMessage::into_inner);

    Template::render(
        "files",
        Context::get_all(&conn, flash, Some(folder), state_files).await,
    )
}

#[get("/index/cancel_task")]
async fn cancel_task(thread_manager: &State<ThreadManager>) -> Template {
    thread_manager.should_cancel.store(true, Ordering::SeqCst);

    let mut task_guard = thread_manager.task.lock().await;
    if let Some(task) = task_guard.take() {
        task.abort();
        
        Template::render(
            "tasks",
            Context {
                flash: Some(("error".into(), "Task cancellation requested.".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    } else {
        Template::render(
            "tasks",
            Context {
                flash: Some(("error".into(), "Task not running".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    }
}

#[get("/index?<force>")]
async fn index_files(config: &State<AppConfig>, flash: Option<FlashMessage<'_>>, conn: DbConn, thread_manager: &State<ThreadManager>, force: Option<&str>) -> Template {
    let flash = flash.map(FlashMessage::into_inner);

    let force_write = force.unwrap_or("false").trim().parse::<bool>().unwrap_or(false);
    
    let mut task_guard = thread_manager.task.lock().await;
    let should_cancel = thread_manager.should_cancel.clone();
    should_cancel.store(false, Ordering::SeqCst);
    
    let images_dirs = config.images_dirs.clone();

    if task_guard.is_some() {
        return Template::render(
            "tasks",
            Context {
                flash: Some(("error".into(), "Task is already running".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    }

    let task = thread_manager.spawn(async move {
        if should_cancel.load(Ordering::SeqCst) {
            return;
        }

        for images_dir in images_dirs {
            files_index::walk_directory(&images_dir, &conn, &force_write).await
        }
    });

    *task_guard = Some(task);
    
    Template::render(
        "tasks",
        Context {
            flash: flash,
            files: vec![],
            folders: vec![],
            count_files: 0,
            roots: vec![],
            tags: vec![],
        },
    )
}

#[get("/?<searchby>&<root>")]
async fn retrieve_folders(flash: Option<FlashMessage<'_>>, conn: DbConn, searchby: Option<&str>, root: Option<&str>) -> Template {
    let flash = flash.map(FlashMessage::into_inner);
    let search_b = searchby.unwrap_or("_");
    let root = root.unwrap_or("_");

    match search_b.starts_with("%") && search_b.ends_with("%") {
        true => {
            let search_bs = &search_b.replace("%", "");
            let root_by = &root.replace("%", "");

            Template::render("index", Context::get_folders(&conn, flash, search_bs, root_by).await)
        }
        false => {
            let search_by = "%".to_owned() + search_b + "%";
            let root_by = "%".to_owned() + root + "%";

            Template::render("index", Context::get_folders(&conn, flash, &search_by, &root_by).await)

        }
    }
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
async fn beta_index(flash: Option<FlashMessage<'_>>, conn: DbConn, searchby: Option<&str>, root: Option<&str>) -> Template {
    let flash = flash.map(FlashMessage::into_inner);
    let search_b = searchby.unwrap_or("_");
    let root = root.unwrap_or("_");

    match search_b.starts_with("%") && search_b.ends_with("%") {
        true => {
            let search_bs = &search_b.replace("%", "");
            let root_by = &root.replace("%", "");

            Template::render("beta", Context::get_folders(&conn, flash, search_bs, root_by).await)
        }
        false => {
            let search_by = "%".to_owned() + search_b + "%";
            let root_by = "%".to_owned() + root + "%";

            Template::render("beta", Context::get_folders(&conn, flash, &search_by, &root_by).await)

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
            .time_to_live(Duration::from_secs(86400)) // 24h
            .build()
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
        .mount(
            "/files",
            routes![index, index_files, cancel_task, retrieve_file, random, random_json, get_all_json],
        )
        .mount("/folders", routes![retrieve_folders, get_thumbnail_folder])
}
