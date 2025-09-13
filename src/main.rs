//! Rust Gallery - A high-performance image gallery application
//!
//! This application provides a web interface for browsing, tagging, and managing images
//! using Rocket as the web framework and Diesel for database operations.
//!
//! Architecture:
//! - Web server: Rocket framework
//! - Database: SQLite with Diesel ORM
//! - Image caching: Moka in-memory cache
//! - Background tasks: ThreadManager for non-blocking operations

#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_sync_db_pools;

// Core modules
mod cache_files;
mod constants;
mod error;
mod handlers;
mod models;
#[cfg(test)]
mod tests;

use moka::sync::Cache;
// Import dependencies
use crate::constants::{CACHE_TTL_1_DAY, CACHE_TTL_4_DAYS, MAX_CACHE_CAPACITY};
use rocket::{
    Build, Rocket,
    fairing::AdHoc,
    fs::{FileServer, Options, relative},
    serde::Deserialize,
};
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions, Error};
use std::{collections::HashMap, sync::Arc, time::Duration};

use crate::handlers::configs::handler::get_config;
use crate::handlers::{
    configs::handler::update_config,
    files::handler::{
        get_all_files_json, get_thumbnail_folder, get_thumbnail_photo, random_json, retrieve_file,
    },
    folders::handler::{
        assign_tag, assign_tag_folder, delete_folder, get_folder_by_name, get_folders_json,
        get_roots_json,
    },
    tags::handler::get_all_tags,
    tasks::handler::{ThreadManager, cancel_task, index_files},
};
// Application-specific imports
use cache_files::{ImageCache, StateFiles};

/// Database connection pool for SQLite
///
/// This connection pool is managed by Rocket and injected
/// into route handlers that need database access.
#[database("sqlite_database")]
pub struct DbConn(diesel::SqliteConnection);

/// Application configuration from Rocket.toml
#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct AppConfig {
    /// Directories containing images to be displayed in the gallery
    images_dirs: Vec<String>,
}

/// Runs database migrations on application startup to ensure
/// the database schema is up-to-date.
///
/// This function executes as part of Rocket's initialization
/// process and runs all pending migrations defined in the
/// "migrations" directory.
async fn run_migrations(rocket: Rocket<Build>) -> Rocket<Build> {
    use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};

    const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

    let conn = DbConn::get_one(&rocket)
        .await
        .expect("Failed to get database connection for migrations");

    conn.run(|c| match c.run_pending_migrations(MIGRATIONS) {
        Ok(_) => info!("Successfully ran database migrations"),
        Err(e) => error!("Failed to run database migrations: {}", e),
    })
    .await;

    rocket
}

/// Configures Cross-Origin Resource Sharing (CORS) for the application
///
/// Enables cross-origin requests to allow frontend applications
/// hosted on different domains to interact with the API.
fn configure_cors() -> Result<rocket_cors::Cors, Error> {
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
///
/// Sets up the Rocket web server with:
/// - Database connection pool
/// - Image caching system
/// - Background task manager
/// - API routes
/// - Static file serving
#[launch]
fn rocket() -> _ {
    // Configure static file serving with options
    let static_files_options = Options::Index | Options::DotFiles;

    // Set up CORS
    let cors = configure_cors().expect("CORS configuration failed");

    // Set up image cache with configurable limits and TTL
    let cache: ImageCache = Arc::new(
        Cache::builder()
            .max_capacity(MAX_CACHE_CAPACITY)
            .time_to_live(Duration::from_secs(CACHE_TTL_4_DAYS))
            .time_to_idle(Duration::from_secs(CACHE_TTL_1_DAY))
            .build(),
    );

    // Initialize thread manager for background tasks
    let thread_manager = ThreadManager::new();

    rocket::build()
        // Register application state
        .manage(StateFiles {
            files: HashMap::new().into(),
        })
        .manage(cache)
        .manage(thread_manager)
        // Configure application
        .attach(cors)
        .attach(AdHoc::config::<AppConfig>())
        .attach(DbConn::fairing())
        .attach(AdHoc::on_ignite("Run Migrations", run_migrations))
        // Mount static file server
        .mount(
            "/",
            FileServer::new(relative!("static"), static_files_options),
        )
        // Mount API routes, organized by functionality
        .mount("/config", routes![update_config, get_config])
        .mount(
            "/tags",
            routes![assign_tag, assign_tag_folder, get_all_tags],
        )
        .mount(
            "/files",
            routes![
                index_files,
                cancel_task,
                retrieve_file,
                random_json,
                get_all_files_json,
                get_thumbnail_photo
            ],
        )
        .mount(
            "/folders",
            routes![
                get_folders_json,
                get_roots_json,
                get_folder_by_name,
                get_thumbnail_folder,
                delete_folder
            ],
        )
}
