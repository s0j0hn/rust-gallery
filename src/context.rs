use diesel::QueryResult;
use rocket::State;
use crate::{Context, DbConn};
use crate::cache_files::StateFiles;
use crate::file_schema::FileSchema;

impl Context {
    pub async fn get_all(
        conn: &DbConn,
        flash: Option<(String, String)>,
        folder: Option<&str>,
        state_files: &State<StateFiles>,
    ) -> Context {
        let folder_name = folder.unwrap_or("*");
        let mut lock = state_files.files.lock().await;
        let folder_files = lock.entry(folder_name.to_string()).or_insert_with(Vec::new);

        if folder_files.iter().count() > 0 {
            Context {
                flash,
                files: folder_files.to_vec(),
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            }
        } else {
            match FileSchema::all_by_folder(
                conn,
                folder.unwrap_or("*").to_string(),
            )
            .await
            {
                Ok(mut files) => {
                    folder_files.append(&mut files);
                    Context {
                        flash,
                        files: folder_files.to_vec(),
                        folders: vec![],
                        count_files: 0,
                        roots: vec![],
                        tags: vec![],
                    }
                }
                Err(e) => {
                    error!("DB File::all() error: {e}");
                    Context {
                        flash: Some(("error".into(), "Fail to access database.".into())),
                        files: vec![],
                        folders: vec![],
                        count_files: 0,
                        roots: vec![],
                        tags: vec![],
                    }
                }
            }
        }
    }

    pub async fn get_folders(conn: &DbConn, flash: Option<(String, String)>, search_by: &str, root: &str) -> Context {
        match FileSchema::get_folders(conn, search_by.to_string(), root.to_string()).await {
            Ok(mut folders_info) => {
                match FileSchema::count_all(&conn).await {
                    Ok(count) => {
                        folders_info.sort_by_key(|folder| folder.folder_name.to_lowercase());
                        
                        match FileSchema::get_roots(&conn).await {
                            Ok(roots) => {
                                match FileSchema::get_all_tags(&conn).await {
                                    Ok(mut tags) => {
                                        tags.sort_by_key(|tag| tag.to_lowercase());
                                        
                                        Context {
                                            flash,
                                            files: vec![],
                                            folders: folders_info,
                                            count_files: count,
                                            roots,
                                            tags: tags,
                                        }
                                    }
                                    Err(e) => {
                                        error!("DB File::get_folders() error: {e}");
                                        Context {
                                            flash: Some(("error".into(), "Fail to access database.".into())),
                                            files: vec![],
                                            folders: vec![],
                                            count_files: 0,
                                            roots: vec![],
                                            tags: vec![],
                                        }
                                    }
                                }
                                
                            }
                            Err(e) => {
                                error!("DB File::get_folders() error: {e}");
                                Context {
                                    flash: Some(("error".into(), "Fail to access database.".into())),
                                    files: vec![],
                                    folders: vec![],
                                    count_files: 0,
                                    roots: vec![],
                                    tags: vec![],
                                }
                            }
                        }
                    }
                    Err(e) => {
                        error!("DB File::get_folders() error: {e}");
                        Context {
                            flash: Some(("error".into(), "Fail to access database.".into())),
                            files: vec![],
                            folders: vec![],
                            count_files: 0,
                            roots: vec![],
                            tags: vec![],
                        }
                    }
                }


            },
            Err(e) => {
                error!("DB File::get_folders() error: {e}");
                Context {
                    flash: Some(("error".into(), "Fail to access database.".into())),
                    files: vec![],
                    folders: vec![],
                    count_files: 0,
                    roots: vec![],
                    tags: vec![],
                }
            }
        }
    }

    pub async fn random(
        conn: &DbConn,
        flash: Option<(String, String)>,
        size: &usize,
        folder: Option<&str>,
    ) -> Context {
        match FileSchema::random(conn, folder.unwrap_or("*").to_string(), *size as i64).await {
            Ok(files) => {
                Context {
                    flash: flash,
                    files,
                    folders: vec![],
                    count_files: 0,
                    roots: vec![],
                    tags: vec![],
                }
            }
            Err(e) => {
                error!("DB File::all() error: {e}");
                Context {
                    flash: Some(("error".into(), "Fail to access database.".into())),
                    files: vec![],
                    folders: vec![],
                    count_files: 0,
                    roots: vec![],
                    tags: vec![],
                }
            }
        }
    }
}