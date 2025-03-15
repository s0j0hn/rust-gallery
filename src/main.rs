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
mod handlers;
mod models;

#[cfg(test)]
mod tests;

// Import handlers organized by functionality
use handlers::{
    configs::handler::update_config,
    files::{
        files_download::{get_thumbnail_folder, retrieve_file},
        files_index::{get_files_by_extension, get_files_by_tag, index_files},
        random_files::random,
        tags::add_tags,
    },
    folders::handler::{
        assign_tag, assign_tag_folder, delete_folder, get_folders, retrieve_folders,
    },
    json::random_files_json::{get_all_json, random_json},
    tasks::task_manager::{ThreadManager, cancel_task},
};

// Import models
use models::file::repository::{FileSchema, FolderInfo};

// Application state and dependencies
use crate::handlers::files::files_download::get_thumbnail_photo;
use crate::handlers::files::tags::get_all_tags;
use crate::handlers::folders::handler::{get_folder_by_name, get_folders_json, get_roots_json};
use cache_files::{ImageCache, StateFiles};
use moka::sync::Cache;
use rocket::{
    Build, Rocket,
    fairing::AdHoc,
    fs::{FileServer, Options, relative},
    serde::{Deserialize, Serialize},
};
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions, Error};
use rocket_dyn_templates::Template;
use std::{collections::HashMap, sync::Arc, time::Duration};

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
    use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};

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

/// Application configuration from Rocket.toml
#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    /// Directories containing images to be displayed in the gallery
    images_dirs: Vec<String>,
}

// Setup CORS
fn make_cors() -> Result<rocket_cors::Cors, Error> {
    let allowed_origins = AllowedOrigins::all();

    CorsOptions {
        allowed_origins,
        allowed_methods: vec!["Get", "Post", "Put", "Delete", "Options", "Head"]
            .into_iter()
            .map(|s| s.parse().unwrap())
            .collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept", "Content-Type"]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
}

/// Main application entrypoint
#[launch]
fn rocket() -> _ {
    // Configure static file serving with options
    let options = Options::Index | Options::DotFiles;

    // CORS
    let cors = make_cors().expect("CORS configuration failed");

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
        .attach(cors)
        .attach(AdHoc::config::<AppConfig>())
        .attach(DbConn::fairing())
        .attach(Template::fairing())
        .attach(AdHoc::on_ignite("Run Migrations", run_migrations))
        // Static files
        .mount("/", FileServer::new(relative!("static"), options))
        // API routes, organized by functionality
        .mount("/configs", routes![update_config])
        //.mount("/beta", routes![beta_index])
        .mount(
            "/tags",
            routes![assign_tag, assign_tag_folder, get_all_tags],
        )
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
                get_files_by_extension,
                get_thumbnail_photo
            ],
        )
        .mount(
            "/folders",
            routes![
                get_folders_json,
                get_roots_json,
                get_folder_by_name,
                retrieve_folders,
                get_thumbnail_folder,
                delete_folder
            ],
        )
}
