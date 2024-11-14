use crate::file_schema::{FileSchema, Image};
use crate::DbConn;
use image::ImageReader;
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs::File;
use std::io;
use std::io::Read;
use std::path::{Path, PathBuf};
use walkdir::{DirEntry, WalkDir};

fn extract_image_info(path: &PathBuf) -> ImageInfo {
    let reader = ImageReader::open(path);
    let dimensions = reader.unwrap().into_dimensions();
    let dim = dimensions.unwrap_or((0, 0));

    let folder_name = PathBuf::from(path)
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_string();

    let file_name = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_string();

    let file_extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_string();

    ImageInfo {
        file_name,
        file_extension,
        folder_name,
        w: dim.0,
        h: dim.1,
    }
}

fn truncate_strings(strings: &mut Vec<String>) {
    for s in strings.iter_mut() {
        if s.len() > 16 {
            *s = s.chars().take(16).collect();
        }
    }
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with("."))
        .unwrap_or(false)
}

pub async fn walk_directory(dir_path: &str, conn: &DbConn, force_write: &bool) {
    println!("************************");
    println!("STARTED INDEXING {}...", dir_path);
    println!("************************");
    let mut printed_dirs: HashSet<String> = HashSet::new();
    let mut set_all_file_schemas: HashSet<String> = HashSet::new();

    if *force_write == false {
        set_all_file_schemas = FileSchema::all_hashes(&conn)
            .await
            .map(|mut hashes| {
                truncate_strings(&mut hashes);
                hashes.into_iter().collect()
            })
            .unwrap_or_default();
    }

    for op_entry in WalkDir::new(dir_path).max_depth(2) {
        match op_entry {
            Ok(entry) => {
                let path = entry.path();

                if is_hidden(&entry) {
                    continue;
                }

                if entry.path().to_str().unwrap().contains("@eadir") {
                    continue;
                }

                if entry.file_type().is_dir() {
                    continue;
                }

                if path.is_dir() {
                    continue;
                }

                if !is_image(path) {
                    continue;
                }

                let file_name = path
                    .file_stem()
                    .and_then(|name| name.to_str())
                    .unwrap_or("")
                    .to_string();

                let vec_file_name_hash: Vec<&str> = file_name.split("_").collect();
                let file_name_hash: &str;
                match vec_file_name_hash.len() == 2 {
                    true => {
                        file_name_hash = vec_file_name_hash[1];
                    }
                    false => {
                        file_name_hash = "";
                    }
                }

                match set_all_file_schemas.get(file_name_hash) {
                    None => {
                        let hash = calculate_sha256(&entry.path());
                        let hash_value = hash.unwrap();

                        // Extract folder name
                        let image_info = extract_image_info(&PathBuf::from(path));
                        let folder_name = image_info.folder_name.clone();
                        let trim_folder_name = image_info
                            .folder_name
                            .to_lowercase()
                            .replace(" ", "-")
                            .replace(
                                &['/', '#', '&', '(', ')', ',', '\"', '.', ';', ':', '\''][..],
                                "",
                            );

                        if image_info.w == 0 || image_info.h == 0 {
                            continue;
                        }

                        let image = Image {
                            root: dir_path.to_string(),
                            path: path.to_str().unwrap().to_string(),
                            hash: hash_value,
                            extention: image_info.file_extension.to_lowercase(),
                            filename: image_info.file_name,
                            folder_name: trim_folder_name,
                            width: image_info.w as i32,
                            height: image_info.h as i32,
                        };

                        match force_write {
                            true => match FileSchema::update(image, conn).await {
                                Ok(_) => {
                                    if printed_dirs.insert(folder_name.clone()) {
                                        println!("Folder: {} - ongoing update...", &folder_name);
                                    }
                                }
                                Err(_) => continue,
                            },
                            false => match FileSchema::insert(image, conn).await {
                                Ok(_) => {
                                    if printed_dirs.insert(folder_name.clone()) {
                                        println!("Folder: {} - ongoing inserts...", &folder_name);
                                    }
                                }
                                Err(_) => continue,
                            },
                        }
                    }
                    Some(_) => {}
                }
            }
            Err(err) => {
                println!("Error: {}", err);
            }
        }
    }
    println!("************************");
    println!("DONE INDEXING {}", dir_path);
    println!("************************");
}

fn is_image(path: &Path) -> bool {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase());

    matches!(extension, Some(ext) if ["jpg", "jpeg", "png", "gif", "bmp", "webp"].contains(&ext.as_str()))
}

fn calculate_sha256(path: &Path) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 4096];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    let hash = hasher.finalize();

    Ok(hash.iter().map(|b| format!("{:02x}", b)).collect())
}

struct ImageInfo {
    file_name: String,
    file_extension: String,
    folder_name: String,
    w: u32,
    h: u32,
}
