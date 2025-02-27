//! Rust Gallery - A high-performance image gallery application
//!
//! This application provides a web interface for browsing, tagging, and managing images
//! using Rocket as the web framework and Diesel for database operations.

#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_sync_db_pools;

// Core modules
mod cache_files;
mod context;
mod models;
mod handlers;

#[cfg(test)]
mod tests;

// Import handlers organized by functionality
use handlers::{
    files::{
        files_download::{get_thumbnail_folder, retrieve_file},
        files_index::{get_files_by_extension, get_files_by_tag, index_files},
        random_files::random,
        tags::add_tags,
    },
    folders::handler::{assign_tag, assign_tag_folder, delete_folder, get_folders, retrieve_folders},
    json::random_files_json::{get_all_json, random_json},
    tasks::task_manager::{cancel_task, ThreadManager},
    configs::handler::update_config,
};

// Import models
use models::file::repository::{FileSchema, FolderInfo};

// Application state and dependencies
use cache_files::{ImageCache, StateFiles};
use moka::sync::Cache;
use rocket::{
    fairing::AdHoc,
    fs::{relative, FileServer, Options},
    request::FlashMessage,
    serde::{Deserialize, Serialize},
    Build, Rocket,
};
use rocket_dyn_templates::Template;
use std::{
    collections::HashMap,
    sync::Arc,
    time::Duration,
};

/// Database connection pool for SQLite
#[database("sqlite_database")]
pub struct DbConn(diesel::SqliteConnection);

/// Context struct for rendering templates
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

/// Run database migrations on application startup
async fn run_migrations(rocket: Rocket<Build>) -> Rocket<Build> {
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

    const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

    let conn = DbConn::get_one(&rocket)
        .await
        .expect("Failed to get database connection for migrations");

    conn.run(|c| {
        // Run pending migrations and capture the result for better error reporting
        match c.run_pending_migrations(MIGRATIONS) {
            Ok(_) => info!("Successfully ran database migrations"),
            Err(e) => error!("Failed to run database migrations: {}", e),
        }
    })
        .await;

    rocket
}

/// Main route handler for the beta interface
///
/// Handles search parameters and root folder filtering
#[get("/?<searchby>&<root>")]
async fn beta_index(
    flash: Option<FlashMessage<'_>>,
    conn: DbConn,
    searchby: Option<&str>,
    root: Option<&str>,
) -> Template {
    let flash = flash.map(FlashMessage::into_inner);

    // Process search parameters with defaults
    let search_term = searchby.unwrap_or("_");
    let root_term = root.unwrap_or("_");

    // Determine if we're doing an exact search or a pattern-matching search
    let (search_pattern, root_pattern): (String, String) = if search_term.starts_with("%") && search_term.ends_with("%") {
        // Exact search (remove % characters)
        (search_term.trim_matches('%').to_string(), root_term.trim_matches('%').to_string())
    } else {
        // Pattern matching search (add % for SQL LIKE)
        (format!("%{}%", search_term), format!("%{}%", root_term))
    };

    // Render template with folder context
    Template::render(
        "beta",
        Context::get_folders(&conn, flash, &search_pattern, &root_pattern).await,
    )
}

/// Application configuration from Rocket.toml
#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    /// Directories containing images to be displayed in the gallery
    images_dirs: Vec<String>,
}

/// Main application entrypoint
#[launch]
fn rocket() -> _ {
    // Configure static file serving with options
    let options = Options::Index | Options::DotFiles;

    // Set up image cache with 4-day TTL
    let cache: ImageCache = Arc::new(
        Cache::builder()
            .time_to_live(Duration::from_secs(345600))
            .build(),
    );

    // Initialize thread manager for background tasks
    let thread_manager = ThreadManager::new();

    rocket::build()
        // Application state
        .manage(StateFiles {
            files: HashMap::new().into(),
        })
        .manage(cache)
        .manage(thread_manager)

        // Configuration
        .attach(AdHoc::config::<AppConfig>())
        .attach(DbConn::fairing())
        .attach(Template::fairing())
        .attach(AdHoc::on_ignite("Run Migrations", run_migrations))

        // Static files
        .mount("/", FileServer::new(relative!("static"), options))

        // API routes, organized by functionality
        .mount("/configs", routes![update_config])
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