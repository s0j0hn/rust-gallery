use crate::cache_files::StateFiles;
use crate::models::file::repository::FileSchema;
use crate::{Context, DbConn};
use rocket::State;

impl Context {
    // Helper method to create an error context
    fn error_context(msg: &str) -> Context {
        error!("DB error: {msg}");
        Context {
            flash: Some(("error".into(), "Fail to access database.".into())),
            files: vec![],
            folders: vec![],
            count_files: 0,
            roots: vec![],
            tags: vec![],
        }
    }

    pub async fn get_all_folders(
        conn: &DbConn,
        flash: Option<(String, String)>,
        folder: Option<&str>,
        state_files: &State<StateFiles>,
    ) -> Context {
        let folder_name = folder.unwrap_or("*");
        let mut lock = state_files.files.lock().await;

        // Check if we already have cached files for this folder
        if let Some(folder_files) = lock.get(folder_name) {
            if !folder_files.is_empty() {
                return Context {
                    flash,
                    files: folder_files.clone(), // Clone is necessary here
                    folders: vec![],
                    count_files: 0,
                    roots: vec![],
                    tags: vec![],
                };
            }
        }

        // If we reach here, we need to fetch from the database
        match FileSchema::all_by_folder(conn, folder_name.to_string()).await {
            Ok(files) => {
                // Store in cache for future use
                lock.entry(folder_name.to_string())
                    .or_insert_with(Vec::new)
                    .extend(files.clone());

                Context {
                    flash,
                    files,
                    folders: vec![],
                    count_files: 0,
                    roots: vec![],
                    tags: vec![],
                }
            }
            Err(e) => {
                error!("DB File::all() error: {e}");
                Self::error_context(&format!("File::all() error: {e}"))
            }
        }
    }

    pub async fn get_folders(
        conn: &DbConn,
        flash: Option<(String, String)>,
        search_by: &str,
        root: &str,
    ) -> Context {
        // Get folders and handle possible error
        let folders_info =
            match FileSchema::get_folders(conn, search_by.to_string(), root.to_string(), 1000, 0)
                .await
            {
                Ok(mut folders) => {
                    folders.sort_by_key(|folder| folder.folder_name.to_lowercase());
                    folders
                }
                Err(e) => return Self::error_context(&format!("File::get_folders() error: {e}")),
            };

        // Get file count
        let count = match FileSchema::count_all(conn).await {
            Ok(count) => count,
            Err(e) => return Self::error_context(&format!("File::count_all() error: {e}")),
        };

        // Get roots
        let roots = match FileSchema::get_roots(conn).await {
            Ok(roots) => roots,
            Err(e) => return Self::error_context(&format!("File::get_roots() error: {e}")),
        };

        // Get and sort tags
        let tags = match FileSchema::get_all_tags(conn, search_by.to_string()).await {
            Ok(mut tags) => {
                tags.sort_by_key(|tag| tag.to_lowercase());
                tags
            }
            Err(e) => return Self::error_context(&format!("File::get_all_tags() error: {e}")),
        };

        // Return the complete context
        Context {
            flash,
            files: vec![],
            folders: folders_info,
            count_files: count,
            roots,
            tags,
        }
    }

    pub async fn random(
        conn: &DbConn,
        flash: Option<(String, String)>,
        size: &usize,
        folder: Option<&str>,
        root: Option<&str>,
        tag: Option<&str>,
        extension: Option<&str>,
        equal: &bool,
        folders_size: &usize,
    ) -> Context {
        // Apply default values for optional parameters
        let folder = folder.unwrap_or("*");
        let root = root.unwrap_or("*");
        let tag = tag.unwrap_or("*");
        let extension = extension.unwrap_or("*");

        match FileSchema::random(
            conn,
            folder.to_string(),
            *size as i64,
            root.to_string(),
            tag.to_string(),
            extension.to_string(),
            *equal,
            *folders_size as i64,
        )
        .await
        {
            Ok(files) => Context {
                flash,
                files,
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
            Err(e) => Self::error_context(&format!("File::random() error: {e}")),
        }
    }
}
