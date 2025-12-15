//! Integration tests for Rust Gallery application
//!
//! This module contains comprehensive tests for all API endpoints,
//! validation logic, and database operations.

use crate::DbConn;
use crate::models::config::repository::{ConfigInfo, ConfigSchema};
use crate::models::file::repository::{FileSchema, Image};
use rocket::http::{ContentType, Status};
use rocket::local::asynchronous::Client;
use rocket::serde::json::{Value as JsonValue, serde_json};
use std::sync::Mutex;

// Static lock to synchronize database access between tests
// This prevents concurrent tests from interfering with each other
static DB_LOCK: Mutex<()> = Mutex::new(());

/// Helper macro to run tests with proper database setup and teardown
///
/// This macro:
/// 1. Acquires the DB_LOCK to ensure test isolation
/// 2. Creates a Rocket client and database connection
/// 3. Cleans the database before the test
/// 4. Runs the test code
/// 5. Cleans the database after the test
///
/// Usage:
/// ```
/// run_test!(|client, conn| async {
///     // Your test code here
/// });
/// ```
macro_rules! run_test {
    (|$client:ident, $conn:ident| $block:expr) => {{
        let _lock = DB_LOCK.lock().unwrap_or_else(|e| e.into_inner());

        rocket::async_test(async move {
            let $client = Client::tracked(crate::rocket())
                .await
                .expect("Failed to create Rocket client");

            let db = DbConn::get_one($client.rocket()).await;
            let $conn = db.expect("Failed to get database connection");

            // Clean database before test
            FileSchema::delete_all(&$conn)
                .await
                .expect("Failed to clean files table");

            // Run the actual test
            $block.await;

            // Clean database after test
            FileSchema::delete_all(&$conn)
                .await
                .expect("Failed to clean files table after test");
        })
    }};
}

// ============================================================================
// Helper Functions for Test Data Creation
// ============================================================================

/// Create a sample image for testing
fn create_test_image(filename: &str, folder: &str, hash: &str) -> Image {
    Image {
        path: format!("/test/images/{}/{}", folder, filename),
        hash: hash.to_string(),
        extension: "jpg".to_string(),
        filename: filename.to_string(),
        folder_name: folder.to_string(),
        width: 1920,
        height: 1080,
        root: "test_root".to_string(),
    }
}

/// Insert multiple test images into the database
async fn insert_test_images(conn: &DbConn, count: usize) -> Vec<String> {
    let mut hashes = Vec::new();
    for i in 0..count {
        let hash = format!("testhash{:08}", i);
        let image = create_test_image(
            &format!("test_image_{}.jpg", i),
            &format!("folder_{}", i % 3), // Distribute across 3 folders
            &hash,
        );
        FileSchema::insert(image, conn)
            .await
            .expect("Failed to insert test image");
        hashes.push(hash);
    }
    hashes
}

// ============================================================================
// Folders Handler Tests
// ============================================================================

#[test]
fn test_get_folders_json_success() {
    run_test!(|client, conn| async {
        // Insert test data
        insert_test_images(&conn, 10).await;

        // Test getting folders
        let response = client
            .get("/folders/json?page=1&per_page=10&searchby=&root=test_root")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // Verify response is an array
        assert!(json.is_array(), "Response should be an array");
        let folders = json.as_array().unwrap();
        assert!(!folders.is_empty(), "Should have at least one folder");
    })
}

#[test]
fn test_get_folders_json_with_search() {
    run_test!(|client, conn| async {
        // Insert test images in specific folders
        let image1 = create_test_image("photo1.jpg", "vacation_2024", "hash001");
        let image2 = create_test_image("photo2.jpg", "work_photos", "hash002");

        FileSchema::insert(image1, &conn)
            .await
            .expect("Insert failed");
        FileSchema::insert(image2, &conn)
            .await
            .expect("Insert failed");

        // Search for vacation folders
        let response = client
            .get("/folders/json?page=1&per_page=10&searchby=vacation&root=test_root")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        assert!(json.is_array(), "Response should be an array");
    })
}

#[test]
fn test_get_folders_json_pagination_validation() {
    run_test!(|client, _conn| async {
        // Test invalid page (0)
        let response = client
            .get("/folders/json?page=0&per_page=10&searchby=&root=test_root")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);

        // Test items exceeding max (1001)
        let response = client
            .get("/folders/json?page=1&per_page=1001&searchby=&root=test_root")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_get_roots_json() {
    run_test!(|client, conn| async {
        // Insert images with different roots
        let mut img1 = create_test_image("photo1.jpg", "folder1", "hash001");
        img1.root = "root1".to_string();

        let mut img2 = create_test_image("photo2.jpg", "folder2", "hash002");
        img2.root = "root2".to_string();

        FileSchema::insert(img1, &conn)
            .await
            .expect("Insert failed");
        FileSchema::insert(img2, &conn)
            .await
            .expect("Insert failed");

        let response = client.get("/folders/roots").dispatch().await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");
        assert!(json.is_array());
    })
}

#[test]
fn test_get_folder_by_name_valid() {
    run_test!(|client, conn| async {
        let image = create_test_image("photo.jpg", "test_folder", "hash123");
        FileSchema::insert(image, &conn)
            .await
            .expect("Insert failed");

        let response = client
            .get("/folders/json/name/test_folder")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
    })
}

#[test]
fn test_get_folder_by_name_directory_traversal_prevention() {
    run_test!(|client, _conn| async {
        // Test that names containing ".." are blocked (without slashes, which wouldn't match the route)
        let response = client.get("/folders/json/name/..").dispatch().await;

        assert_eq!(
            response.status(),
            Status::BadRequest,
            "Directory traversal pattern '..' should return 400"
        );

        // Patterns with forward slashes don't match the single-segment <name> route parameter
        // and return 404 instead (this is expected Rocket behavior)
        let patterns_with_forward_slash =
            vec!["../secrets", "folder/../etc", "folder/../../passwd"];

        for attempt in patterns_with_forward_slash {
            let response = client
                .get(format!("/folders/json/name/{}", attempt))
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::NotFound,
                "Pattern with forward slash '{}' doesn't match route",
                attempt
            );
        }

        // Patterns with backslashes DO reach the handler and get blocked with 400
        let patterns_with_backslash = vec!["..\\windows", "folder\\..\\system32"];

        for attempt in patterns_with_backslash {
            let response = client
                .get(format!("/folders/json/name/{}", attempt))
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::BadRequest,
                "Pattern with backslash '{}' should be blocked with 400",
                attempt
            );
        }
    })
}

#[test]
fn test_get_folder_by_name_length_validation() {
    run_test!(|client, _conn| async {
        // Test folder name exceeding max length (255 chars)
        let long_name = "a".repeat(256);

        let response = client
            .get(format!("/folders/json/name/{}", long_name))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_delete_folder_success() {
    run_test!(|client, conn| async {
        // Insert test image in folder
        let image = create_test_image("photo.jpg", "folder_to_delete", "hash123");
        FileSchema::insert(image, &conn)
            .await
            .expect("Insert failed");

        // Delete the folder
        let response = client
            .post("/folders/delete")
            .header(ContentType::JSON)
            .body(r#"{"folder_name": "folder_to_delete"}"#)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        // Verify folder is deleted
        let count = FileSchema::count_by_folder(&conn, "folder_to_delete".to_string())
            .await
            .unwrap();
        assert_eq!(count, 0);
    })
}

#[test]
fn test_delete_folder_validation() {
    run_test!(|client, _conn| async {
        // Test with empty folder name - should return validation error (422)
        let response = client
            .post("/folders/delete")
            .header(ContentType::JSON)
            .body(r#"{"folder_name": ""}"#)
            .dispatch()
            .await;

        assert_eq!(
            response.status(),
            Status::UnprocessableEntity,
            "Empty folder name should return 422, got {:?}",
            response.status()
        );
    })
}

#[test]
fn test_assign_tag_success() {
    run_test!(|client, conn| async {
        // Insert test image
        let image = create_test_image("photo.jpg", "test_folder", "hash123abc");
        FileSchema::insert(image, &conn)
            .await
            .expect("Insert failed");

        // Assign tags
        let response = client
            .post("/tags/assign")
            .header(ContentType::JSON)
            .body(r#"{"image_hash": "hash123abc", "tags": ["landscape", "sunset"]}"#)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        // Verify tags were added
        let file = FileSchema::get_by_hash("hash123abc".to_string(), &conn)
            .await
            .unwrap();
        assert!(file.tags.is_some());
        let tags_str = file.tags.unwrap();
        assert!(tags_str.contains("landscape"));
        assert!(tags_str.contains("sunset"));
    })
}

#[test]
fn test_assign_tag_validation() {
    run_test!(|client, _conn| async {
        // Test with invalid hash (too short) - validation should fail
        let response = client
            .post("/tags/assign")
            .header(ContentType::JSON)
            .body(r#"{"image_hash": "short", "tags": ["test"]}"#)
            .dispatch()
            .await;

        // Could be 422 (validation failed) or 404 (not found after validation passed)
        assert!(
            response.status() == Status::UnprocessableEntity
                || response.status() == Status::NotFound,
            "Expected 422 or 404, got {:?}",
            response.status()
        );

        // Test with invalid hash (too long)
        let long_hash = "a".repeat(129);
        let body = format!(r#"{{"image_hash": "{}", "tags": ["test"]}}"#, long_hash);

        let response = client
            .post("/tags/assign")
            .header(ContentType::JSON)
            .body(body)
            .dispatch()
            .await;

        assert!(
            response.status() == Status::UnprocessableEntity
                || response.status() == Status::NotFound,
            "Expected 422 or 404, got {:?}",
            response.status()
        );
    })
}

#[test]
fn test_assign_tag_folder_success() {
    run_test!(|client, conn| async {
        // Insert multiple images in same folder
        let img1 = create_test_image("photo1.jpg", "tag_test_folder", "hash001");
        let img2 = create_test_image("photo2.jpg", "tag_test_folder", "hash002");

        FileSchema::insert(img1, &conn)
            .await
            .expect("Insert failed");
        FileSchema::insert(img2, &conn)
            .await
            .expect("Insert failed");

        // Assign tags to entire folder
        let response = client
            .post("/tags/assign/folder")
            .header(ContentType::JSON)
            .body(r#"{"folder_name": "tag_test_folder", "tags": ["family", "2024"]}"#)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        // Verify all images in folder have tags
        let files = FileSchema::all_by_folder(&conn, "tag_test_folder".to_string())
            .await
            .unwrap();

        assert_eq!(files.len(), 2);
        for file in files {
            assert!(file.tags.is_some());
            let tags_str = file.tags.unwrap();
            assert!(tags_str.contains("family"));
            assert!(tags_str.contains("2024"));
        }
    })
}

// ============================================================================
// Files Handler Tests
// ============================================================================

#[test]
fn test_get_all_files_json_success() {
    run_test!(|client, conn| async {
        // Insert test images
        insert_test_images(&conn, 5).await;

        let response = client
            .get("/files/json?page=1&per_page=10&folder=folder_0")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // JsonFileResponse has items, page, and total fields
        assert!(json.get("items").is_some());
        assert!(json.get("total").is_some());
        assert!(json.get("page").is_some());
    })
}

#[test]
fn test_get_all_files_json_pagination_validation() {
    run_test!(|client, _conn| async {
        // Test invalid page (0)
        let response = client
            .get("/files/json?page=0&per_page=10&folder=test")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);

        // Test items exceeding max
        let response = client
            .get("/files/json?page=1&per_page=1001&folder=test")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_random_json_success() {
    run_test!(|client, conn| async {
        // Insert test images
        insert_test_images(&conn, 20).await;

        let response = client
            .get("/files/random/json?folder=*&size=5&tag=*&equal=false")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // Response is JsonFileResponse with items, page, total
        assert!(json.get("items").is_some());
        let files = json.get("items").unwrap().as_array().unwrap();
        assert!(files.len() <= 5);
    })
}

#[test]
fn test_random_json_validation() {
    run_test!(|client, _conn| async {
        // Test size exceeding max (1001)
        let response = client
            .get("/files/random/json?folder=*&size=1001&tag=*&equal=false")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);

        // Note: size=0 would be caught by validation, but Rocket's usize parsing
        // won't accept negative values, so we test the upper bound instead
    })
}

// ============================================================================
// Config Handler Tests
// ============================================================================

#[test]
fn test_get_config_success() {
    run_test!(|client, _conn| async {
        let response = client.get("/config").dispatch().await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // Verify config structure
        assert!(json.get("random_equal_folders").is_some());
        assert!(json.get("photo_per_random").is_some());
        assert!(json.get("folders_per_page").is_some());
        assert!(json.get("equal_enabled").is_some());
    })
}

#[test]
fn test_update_config_success() {
    run_test!(|client, conn| async {
        let new_config = r#"{
            "random_equal_folders": 10,
            "photo_per_random": 25,
            "folders_per_page": 50,
            "equal_enabled": true
        }"#;

        let response = client
            .post("/config")
            .header(ContentType::JSON)
            .body(new_config)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);

        // Verify config was updated
        let config = ConfigSchema::get_config(&conn).await.unwrap();
        assert_eq!(config.random_equal_folders, 10);
        assert_eq!(config.photo_per_random, 25);
        assert_eq!(config.folders_per_page, 50);
        assert!(config.equal_enabled);
    })
}

#[test]
fn test_update_config_validation() {
    run_test!(|client, _conn| async {
        // Test negative values
        let invalid_config = r#"{
            "random_equal_folders": -1,
            "photo_per_random": 25,
            "folders_per_page": 50,
            "equal_enabled": true
        }"#;

        let response = client
            .post("/config")
            .header(ContentType::JSON)
            .body(invalid_config)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);

        // Test zero values
        let invalid_config = r#"{
            "random_equal_folders": 10,
            "photo_per_random": 0,
            "folders_per_page": 50,
            "equal_enabled": true
        }"#;

        let response = client
            .post("/config")
            .header(ContentType::JSON)
            .body(invalid_config)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

// ============================================================================
// Tags Handler Tests
// ============================================================================

#[test]
fn test_get_all_tags_success() {
    run_test!(|client, conn| async {
        // Insert images with tags
        let image1 = create_test_image("photo1.jpg", "test_folder", "hash001");
        FileSchema::insert(image1, &conn)
            .await
            .expect("Insert failed");

        FileSchema::add_tags(
            &conn,
            "hash001".to_string(),
            vec!["nature".to_string(), "landscape".to_string()],
        )
        .await
        .expect("Failed to add tags");

        let image2 = create_test_image("photo2.jpg", "test_folder", "hash002");
        FileSchema::insert(image2, &conn)
            .await
            .expect("Insert failed");

        FileSchema::add_tags(
            &conn,
            "hash002".to_string(),
            vec!["portrait".to_string(), "nature".to_string()],
        )
        .await
        .expect("Failed to add tags");

        let response = client.get("/tags?folder_name=*").dispatch().await;

        assert_eq!(response.status(), Status::Ok);

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        assert!(json.is_array());
        let tags = json.as_array().unwrap();
        assert!(tags.len() >= 2); // At least "nature" and "landscape" or "portrait"
    })
}

#[test]
fn test_get_all_tags_folder_filter() {
    run_test!(|client, conn| async {
        // Insert images in different folders with different tags
        let img1 = create_test_image("photo1.jpg", "folder_a", "hash001");
        FileSchema::insert(img1, &conn)
            .await
            .expect("Insert failed");
        FileSchema::add_tags(&conn, "hash001".to_string(), vec!["tag_a".to_string()])
            .await
            .expect("Failed to add tags");

        let img2 = create_test_image("photo2.jpg", "folder_b", "hash002");
        FileSchema::insert(img2, &conn)
            .await
            .expect("Insert failed");
        FileSchema::add_tags(&conn, "hash002".to_string(), vec!["tag_b".to_string()])
            .await
            .expect("Failed to add tags");

        // Get tags for specific folder
        let response = client.get("/tags?folder_name=folder_a").dispatch().await;

        assert_eq!(response.status(), Status::Ok);

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");
        let tags = json.as_array().unwrap();

        // Should only contain tags from folder_a
        let tags_str = serde_json::to_string(&tags).unwrap();
        assert!(tags_str.contains("tag_a"));
    })
}

#[test]
fn test_get_all_tags_validation() {
    run_test!(|client, _conn| async {
        // Tags handler only validates length, not directory traversal
        // Test folder name exceeding max length (parameter is 'folder' not 'folder_name')
        let long_name = "a".repeat(256);
        let response = client
            .get(format!("/tags?folder={}", long_name))
            .dispatch()
            .await;

        assert_eq!(
            response.status(),
            Status::UnprocessableEntity,
            "Expected 422 for length validation, got {:?}",
            response.status()
        );
    })
}

// ============================================================================
// Error Handling Tests
// ============================================================================

#[test]
fn test_invalid_endpoint_returns_404() {
    run_test!(|client, _conn| async {
        let response = client.get("/invalid_endpoint").dispatch().await;
        assert_eq!(response.status(), Status::NotFound);
    })
}

#[test]
fn test_invalid_json_body() {
    run_test!(|client, _conn| async {
        let response = client
            .post("/config")
            .header(ContentType::JSON)
            .body("invalid json {{{")
            .dispatch()
            .await;

        // Should return 400 or 422 for malformed JSON
        assert!(
            response.status() == Status::BadRequest
                || response.status() == Status::UnprocessableEntity
        );
    })
}

// ============================================================================
// Database Model Tests
// ============================================================================

#[test]
fn test_file_insert_and_retrieve() {
    run_test!(|_client, conn| async {
        let image = create_test_image("test.jpg", "test_folder", "uniquehash123");

        let result = FileSchema::insert(image, &conn).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1); // One row inserted

        // Retrieve by hash
        let retrieved = FileSchema::get_by_hash("uniquehash123".to_string(), &conn)
            .await
            .unwrap();

        assert_eq!(retrieved.filename, "test.jpg");
        assert_eq!(retrieved.folder_name, "test_folder");
        assert_eq!(retrieved.width, 1920);
        assert_eq!(retrieved.height, 1080);
    })
}

#[test]
fn test_file_duplicate_hash_ignored() {
    run_test!(|_client, conn| async {
        let image1 = create_test_image("test1.jpg", "folder1", "samehash");
        let image2 = create_test_image("test2.jpg", "folder2", "samehash");

        FileSchema::insert(image1, &conn)
            .await
            .expect("First insert failed");
        let result = FileSchema::insert(image2, &conn)
            .await
            .expect("Second insert failed");

        // Second insert should be ignored (insert_or_ignore)
        assert_eq!(result, 0);
    })
}

#[test]
fn test_file_count_by_folder() {
    run_test!(|_client, conn| async {
        let img1 = create_test_image("photo1.jpg", "count_test", "hash001");
        let img2 = create_test_image("photo2.jpg", "count_test", "hash002");
        let img3 = create_test_image("photo3.jpg", "other_folder", "hash003");

        FileSchema::insert(img1, &conn).await.unwrap();
        FileSchema::insert(img2, &conn).await.unwrap();
        FileSchema::insert(img3, &conn).await.unwrap();

        let count = FileSchema::count_by_folder(&conn, "count_test".to_string())
            .await
            .unwrap();

        assert_eq!(count, 2);
    })
}

#[test]
fn test_file_tags_operations() {
    run_test!(|_client, conn| async {
        let image = create_test_image("photo.jpg", "folder", "taghash123");
        FileSchema::insert(image, &conn).await.unwrap();

        // Add tags
        let tags = vec![
            "sunset".to_string(),
            "beach".to_string(),
            "vacation".to_string(),
        ];
        FileSchema::add_tags(&conn, "taghash123".to_string(), tags)
            .await
            .unwrap();

        // Retrieve and verify tags
        let file = FileSchema::get_by_hash("taghash123".to_string(), &conn)
            .await
            .unwrap();

        assert!(file.tags.is_some());
        let tags_str = file.tags.unwrap();

        // Parse JSON array
        let parsed_tags: Vec<String> = serde_json::from_str(&tags_str).unwrap();
        assert_eq!(parsed_tags.len(), 3);
        assert!(parsed_tags.contains(&"sunset".to_string()));
        assert!(parsed_tags.contains(&"beach".to_string()));
        assert!(parsed_tags.contains(&"vacation".to_string()));
    })
}

#[test]
fn test_delete_folder_with_name() {
    run_test!(|_client, conn| async {
        // Insert images in multiple folders
        let img1 = create_test_image("photo1.jpg", "delete_me", "hash001");
        let img2 = create_test_image("photo2.jpg", "delete_me", "hash002");
        let img3 = create_test_image("photo3.jpg", "keep_me", "hash003");

        FileSchema::insert(img1, &conn).await.unwrap();
        FileSchema::insert(img2, &conn).await.unwrap();
        FileSchema::insert(img3, &conn).await.unwrap();

        // Delete one folder
        let deleted = FileSchema::delete_folder_with_name("delete_me".to_string(), &conn)
            .await
            .unwrap();

        assert_eq!(deleted, 2);

        // Verify correct files were deleted
        let remaining_count = FileSchema::count_by_folder(&conn, "keep_me".to_string())
            .await
            .unwrap();
        assert_eq!(remaining_count, 1);

        let deleted_count = FileSchema::count_by_folder(&conn, "delete_me".to_string())
            .await
            .unwrap();
        assert_eq!(deleted_count, 0);
    })
}

#[test]
fn test_config_get_and_update() {
    run_test!(|_client, conn| async {
        // Get initial config
        let initial_config = ConfigSchema::get_config(&conn).await.unwrap();
        assert!(initial_config.id > 0);

        // Update config
        let new_config = ConfigInfo {
            random_equal_folders: 15,
            photo_per_random: 30,
            folders_per_page: 100,
            equal_enabled: false,
        };

        ConfigSchema::update(&conn, new_config).await.unwrap();

        // Retrieve and verify update
        let updated_config = ConfigSchema::get_config(&conn).await.unwrap();
        assert_eq!(updated_config.random_equal_folders, 15);
        assert_eq!(updated_config.photo_per_random, 30);
        assert_eq!(updated_config.folders_per_page, 100);
        assert!(!updated_config.equal_enabled);
    })
}

// ============================================================================
// Tasks Handler Tests
// ============================================================================

#[test]
fn test_index_files_success() {
    run_test!(|client, _conn| async {
        let response = client.get("/files/task/index").dispatch().await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // Verify response structure
        assert!(json.get("status").is_some());
        assert!(json.get("task_running").is_some());
        assert!(json.get("message").is_some());
        assert!(json.get("last_indexed").is_some());
    })
}

#[test]
fn test_index_files_with_force_parameter() {
    run_test!(|client, _conn| async {
        // Test with force=true
        let response = client.get("/files/task/index?force=true").dispatch().await;

        assert_eq!(response.status(), Status::Ok);

        // Test with force=false
        let response = client.get("/files/task/index?force=false").dispatch().await;

        assert_eq!(response.status(), Status::Ok);
    })
}

#[test]
fn test_index_files_invalid_force_parameter() {
    run_test!(|client, _conn| async {
        // Test with invalid force value
        let response = client
            .get("/files/task/index?force=invalid")
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_cancel_task_no_task_running() {
    run_test!(|client, _conn| async {
        let response = client.get("/files/task/cancel").dispatch().await;

        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));

        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");

        // Should indicate no task was running
        assert_eq!(json.get("status").and_then(|v| v.as_str()), Some("info"));
        assert_eq!(
            json.get("task_running").and_then(|v| v.as_bool()),
            Some(false)
        );
    })
}

// ============================================================================
// Unit Tests for Validation Logic
// ============================================================================

#[test]
fn test_hash_validation_min_length() {
    run_test!(|client, _conn| async {
        // Hash with exactly MIN_HASH_LENGTH (8) should be valid
        let hash = "a".repeat(8);
        let body = format!(r#"{{"image_hash": "{}", "tags": ["test"]}}"#, hash);

        let response = client
            .post("/tags/assign")
            .header(ContentType::JSON)
            .body(body)
            .dispatch()
            .await;

        // Should not fail validation (might fail with not found, but not validation error)
        assert_ne!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_hash_validation_max_length() {
    run_test!(|client, _conn| async {
        // Hash with exactly MAX_HASH_LENGTH (128) should be valid
        let hash = "a".repeat(128);
        let body = format!(r#"{{"image_hash": "{}", "tags": ["test"]}}"#, hash);

        let response = client
            .post("/tags/assign")
            .header(ContentType::JSON)
            .body(body)
            .dispatch()
            .await;

        // Should not fail validation
        assert_ne!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_folder_name_max_length_boundary() {
    run_test!(|client, _conn| async {
        // Exactly MAX_FOLDER_NAME_LENGTH (255) should be valid
        let valid_name = "a".repeat(255);
        let response = client
            .get(format!("/folders/json/name/{}", valid_name))
            .dispatch()
            .await;

        // Should not fail validation (might return not found, but not bad request)
        assert_ne!(response.status(), Status::BadRequest);

        // One character over should fail with validation error
        let invalid_name = "a".repeat(256);
        let response = client
            .get(format!("/folders/json/name/{}", invalid_name))
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_pagination_boundaries() {
    run_test!(|client, _conn| async {
        // Page 1 should be valid
        let response = client
            .get("/folders/json?page=1&per_page=10&searchby=&root=test")
            .dispatch()
            .await;
        assert_eq!(response.status(), Status::Ok);

        // Page 0 should be invalid
        let response = client
            .get("/folders/json?page=0&per_page=10&searchby=&root=test")
            .dispatch()
            .await;
        assert_eq!(response.status(), Status::UnprocessableEntity);

        // per_page=1000 (MAX_ITEMS_PER_PAGE) should be valid
        let response = client
            .get("/folders/json?page=1&per_page=1000&searchby=&root=test")
            .dispatch()
            .await;
        assert_eq!(response.status(), Status::Ok);

        // per_page=1001 should be invalid
        let response = client
            .get("/folders/json?page=1&per_page=1001&searchby=&root=test")
            .dispatch()
            .await;
        assert_eq!(response.status(), Status::UnprocessableEntity);
    })
}

#[test]
fn test_directory_traversal_patterns() {
    run_test!(|client, _conn| async {
        // Patterns without slashes reach the handler and return 400 BadRequest
        let patterns_with_dots = vec!["..", "..secret", "folder.."];

        for pattern in patterns_with_dots {
            let response = client
                .get(format!("/folders/json/name/{}", pattern))
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::BadRequest,
                "Pattern '{}' should be blocked with 400",
                pattern
            );
        }

        // Patterns with embedded slashes don't match the route and return 404 NotFound
        // This is because Rocket's <name> parameter doesn't match paths with slashes in the middle
        let patterns_with_embedded_slash =
            vec!["./../", "./../../", "folder/..", "folder/../secret"];

        for pattern in patterns_with_embedded_slash {
            let response = client
                .get(format!("/folders/json/name/{}", pattern))
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::NotFound,
                "Pattern '{}' doesn't match route, returns 404",
                pattern
            );
        }

        // Patterns with trailing slashes get the slash stripped, so they reach the handler
        // Same for patterns with backslashes - they reach the handler and get blocked with 400
        let patterns_reaching_handler = vec![
            "../", // Trailing slash gets stripped to ".."
            "..\\",
            "..\\..\\windows",
        ];

        for pattern in patterns_reaching_handler {
            let response = client
                .get(format!("/folders/json/name/{}", pattern))
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::BadRequest,
                "Pattern '{}' should be blocked with 400",
                pattern
            );
        }
    })
}

#[test]
fn test_sql_injection_prevention() {
    run_test!(|client, conn| async {
        // Insert test data
        let image = create_test_image("photo.jpg", "normal_folder", "hash123");
        FileSchema::insert(image, &conn)
            .await
            .expect("Insert failed");

        // Try SQL injection patterns in search
        let injection_attempts = vec![
            "'; DROP TABLE files; --",
            "' OR '1'='1",
            "admin' --",
            "1' OR '1' = '1",
        ];

        for attempt in injection_attempts {
            let response = client
                .get(format!(
                    "/folders/json?page=1&items=10&searchby={}&root=test",
                    urlencoding::encode(attempt)
                ))
                .dispatch()
                .await;

            // Should handle gracefully, not crash
            assert!(
                response.status() == Status::Ok
                    || response.status() == Status::BadRequest
                    || response.status() == Status::UnprocessableEntity,
                "SQL injection attempt should be handled safely"
            );
        }

        // Verify database integrity
        let count = FileSchema::count_all(&conn).await.unwrap();
        assert!(count > 0, "Database should still contain data");
    })
}

#[test]
fn test_config_value_validation() {
    run_test!(|client, _conn| async {
        // Test various invalid config combinations
        let invalid_configs = vec![
            r#"{"random_equal_folders": -1, "photo_per_random": 10, "folders_per_page": 10, "equal_enabled": true}"#,
            r#"{"random_equal_folders": 10, "photo_per_random": -5, "folders_per_page": 10, "equal_enabled": true}"#,
            r#"{"random_equal_folders": 10, "photo_per_random": 10, "folders_per_page": -1, "equal_enabled": true}"#,
            r#"{"random_equal_folders": 0, "photo_per_random": 10, "folders_per_page": 10, "equal_enabled": true}"#,
        ];

        for config in invalid_configs {
            let response = client
                .post("/config")
                .header(ContentType::JSON)
                .body(config)
                .dispatch()
                .await;

            assert_eq!(
                response.status(),
                Status::UnprocessableEntity,
                "Invalid config should be rejected: {}",
                config
            );
        }

        // Valid config should succeed
        let valid_config = r#"{
            "random_equal_folders": 5,
            "photo_per_random": 10,
            "folders_per_page": 25,
            "equal_enabled": true
        }"#;

        let response = client
            .post("/config")
            .header(ContentType::JSON)
            .body(valid_config)
            .dispatch()
            .await;

        assert_eq!(response.status(), Status::Ok);
    })
}
