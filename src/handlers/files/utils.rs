use crate::DbConn;
use crate::cache_files::CachedImage;
use crate::constants::*;
use crate::error::AppError;
use crate::logging::utils::{log_slow_operation, log_performance_metric};
use crate::models::file::repository::{FileSchema, Image};
use image::{DynamicImage, ImageFormat, ImageReader};
use rocket::http::ContentType;
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fmt::Write;
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, UNIX_EPOCH};
use std::{fs, io};
use walkdir::{DirEntry, WalkDir};

fn extract_image_info(path: &PathBuf) -> ImageInfo {
    let dim = match ImageReader::open(path) {
        Ok(reader) => reader.into_dimensions().unwrap_or((0, 0)),
        Err(_) => {
            warn!("Failed to read image dimensions for: {:?}", path);
            (0, 0)
        }
    };

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

fn truncate_strings(strings: &mut [String]) {
    for s in strings.iter_mut() {
        if s.len() > FILENAME_TRUNCATE_LENGTH {
            *s = s.chars().take(FILENAME_TRUNCATE_LENGTH).collect();
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

pub async fn walk_directory(
    dir_path: &str,
    conn: &DbConn,
    force_write: &bool,
    last_indexed: Option<u64>,
) {
    println!("************************");
    println!("STARTED INDEXING {dir_path}...");
    println!("************************");
    let mut printed_dirs: HashSet<String> = HashSet::new();
    let mut set_all_file_schemas: HashSet<String> = HashSet::new();

    if !(*force_write) {
        set_all_file_schemas = FileSchema::all_hashes(conn)
            .await
            .map(|mut hashes| {
                truncate_strings(&mut hashes);
                hashes.into_iter().collect()
            })
            .unwrap_or_default();
    }

    for op_entry in WalkDir::new(dir_path).max_depth(MAX_WALKDIR_DEPTH) {
        match op_entry {
            Ok(entry) => {
                let path = entry.path();

                if is_hidden(&entry) {
                    continue;
                }

                if let Some(path_str) = entry.path().to_str() {
                    if path_str.contains("@eadir") {
                        continue;
                    }
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

                // Skip files that haven't been modified since last indexation
                if !force_write && last_indexed.is_some() {
                    if let Ok(metadata) = fs::metadata(path) {
                        if let Ok(modified_time) = metadata.modified() {
                            if let Ok(modified_since_epoch) =
                                modified_time.duration_since(UNIX_EPOCH)
                            {
                                let modified_secs = modified_since_epoch.as_secs();
                                if modified_secs <= last_indexed.unwrap() {
                                    // File hasn't been modified since last indexation
                                    continue;
                                }
                            }
                        }
                    }
                }

                let file_name = path
                    .file_stem()
                    .and_then(|name| name.to_str())
                    .unwrap_or("")
                    .to_string();

                let vec_file_name_hash: Vec<&str> = file_name.split("_").collect();

                let file_name_hash: &str = match vec_file_name_hash.len() == 2 {
                    true => vec_file_name_hash[1],
                    false => "",
                };

                if !set_all_file_schemas.contains(file_name_hash) {
                    let hash = calculate_sha256(entry.path());
                    let hash_value = hash.unwrap();

                    // Extract folder name
                    let image_info = extract_image_info(&PathBuf::from(path));
                    let folder_name = image_info.folder_name.clone();
                    // remove the not wanted chars in the folder name
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

                    let path_str = match path.to_str() {
                        Some(s) => s.to_string(),
                        None => {
                            warn!("Invalid path encoding: {:?}", path);
                            continue;
                        }
                    };

                    let image = Image {
                        root: dir_path.to_string(),
                        path: path_str,
                        hash: hash_value,
                        extension: image_info.file_extension.to_lowercase(),
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
            }
            Err(err) => {
                println!("Error: {err}");
            }
        }
    }
    println!("************************");
    println!("DONE INDEXING {dir_path}");
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
    let start = Instant::now();
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; HASH_BUFFER_SIZE];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    let hash = hasher.finalize();

    // Pre-allocate a string with the right capacity (2 hex chars per byte)
    let mut hex_string = String::with_capacity(hash.len() * 2);

    hash.iter().fold(&mut hex_string, |string, byte| {
        let _ = write!(string, "{byte:02x}");
        string
    });

    let duration = start.elapsed();
    log_slow_operation("calculate_sha256", duration, Duration::from_millis(100));
    log_performance_metric("hash_calculation_time_ms", duration.as_millis() as f64, "ms");

    Ok(hex_string)
}

struct ImageInfo {
    file_name: String,
    file_extension: String,
    folder_name: String,
    w: u32,
    h: u32,
}

// Helper function to determine content type from file extension
pub fn get_content_type(extension: &str) -> ContentType {
    match extension.to_lowercase().as_str() {
        "png" => ContentType::PNG,
        "jpg" | "jpeg" => ContentType::JPEG,
        "gif" => ContentType::GIF,
        "webp" => ContentType::new("image", "webp"),
        "avif" => ContentType::new("image", "avif"),
        _ => ContentType::JPEG, // Default
    }
}

// Helper function to create CachedImage with caching headers
pub fn create_cached_image(
    data: Vec<u8>,
    extension: &str,
    cache_duration_secs: u64,
) -> CachedImage {
    let content_type = get_content_type(extension);
    let cache_duration = Duration::from_secs(cache_duration_secs);
    CachedImage::with_cache(data, content_type, cache_duration)
}

pub fn read_file_to_buffer(path: &str) -> Result<Vec<u8>, AppError> {
    let mut file = File::open(path).map_err(AppError::IoError)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(AppError::IoError)?;
    Ok(buffer)
}

pub fn create_image_buffer(
    f_schema: &FileSchema,
    image: &DynamicImage,
) -> Result<Vec<u8>, AppError> {
    let start = Instant::now();

    let format = match f_schema.extension.as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "gif" => ImageFormat::Gif,
        "webp" => ImageFormat::WebP,
        ext => {
            return Err(AppError::bad_request(format!(
                "Unsupported image format: {ext}"
            )));
        }
    };

    let mut buffer = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut buffer), format)
        .map_err(AppError::ImageError)?;

    let duration = start.elapsed();
    let operation = format!("create_image_buffer_{}", f_schema.extension);
    log_slow_operation(&operation, duration, Duration::from_millis(500));
    log_performance_metric("image_encode_time_ms", duration.as_millis() as f64, "ms");

    Ok(buffer)
}
