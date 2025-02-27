use super::models::file::repository::FileSchema;
use super::models::file::File;

use rand::{distributions::Alphanumeric, thread_rng, Rng};
use rocket::http::{ContentType, Status};
use rocket::local::asynchronous::Client;
use rocket::serde::json::{json, Value as JsonValue};

// We use a lock to synchronize between tests so DB operations don't collide.
// For now. In the future, we'll have a nice way to run each test in a DB
// transaction so we can regain concurrency.
static DB_LOCK: parking_lot::Mutex<()> = parking_lot::const_mutex(());

/// Generate a random string of the specified length for test data
fn random_string(length: usize) -> String {
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

/// Create a test file with random data in the database
async fn create_test_file(conn: &super::DbConn) -> File {
    let file_name = format!("test_{}.jpg", random_string(8));
    // Create a test file record - adjust fields according to your actual File model
    let file = FileSchema::create(
        conn,
        &file_name,
        "image/jpeg",
        &format!("/test/path/{}", file_name),
        None, // folder_id if applicable
    )
        .await
        .expect("Failed to create test file");

    file
}

macro_rules! run_test {
    (|$client:ident, $conn:ident| $block:expr) => {{
        let _lock = DB_LOCK.lock();

        rocket::async_test(async move {
            let $client = Client::tracked(super::rocket())
                .await
                .expect("Rocket client");
            let db = super::DbConn::get_one($client.rocket()).await;
            let $conn = db.expect("Failed to get database connection for testing");
            
            // Clean database before test
            FileSchema::delete_all(&$conn)
                .await
                .expect("Failed to delete all files for testing");

            // Run the actual test
            let result = $block;
            
            // Clean database after test
            FileSchema::delete_all(&$conn)
                .await
                .expect("Failed to delete all files after testing");
            
            result
        })
    }};
}

#[test]
fn test_index() {
    run_test!(|client, _conn| async {
        let response = client.get("/folders").dispatch().await;
        
        // Check status code
        assert_eq!(response.status(), Status::Ok);
        
        // Check content type
        assert_eq!(response.content_type(), Some(ContentType::JSON));
        
        // Parse and verify response body structure
        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");
        
        // Verify the response contains expected fields
        assert!(json.as_object().unwrap().contains_key("folders"), 
                "Response should contain 'folders' key");
    })
}

#[test]
fn test_index_search() {
    run_test!(|client, conn| async {
        // Create a test file with a specific name for searching
        let test_name = "alice_test_file.jpg";
        FileSchema::create(
            &conn,
            test_name,
            "image/jpeg",
            &format!("/test/path/{}", test_name),
            None,
        )
        .await
        .expect("Failed to create test file");
        
        // Search for the file by name
        let response = client.get("/folders?searchby=alice").dispatch().await;
        
        // Check status and content type
        assert_eq!(response.status(), Status::Ok);
        assert_eq!(response.content_type(), Some(ContentType::JSON));
        
        // Verify search results contain our test file
        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");
        
        // Perform more specific assertions on the search results
        // (The exact verification will depend on your API's response format)
        let folders = json.as_object().unwrap().get("folders").expect("Folders key");
        
        // Add assertions to verify the search results contain our test file
        // This will depend on your exact response structure
    })
}

#[test]
fn test_empty_search_returns_all() {
    run_test!(|client, conn| async {
        // Create multiple test files
        for i in 0..3 {
            create_test_file(&conn).await;
        }
        
        // Test empty search returns all files
        let response = client.get("/folders?searchby=").dispatch().await;
        
        assert_eq!(response.status(), Status::Ok);
        
        // Verify all files are returned
        let body = response.into_string().await.expect("Response body");
        let json: JsonValue = serde_json::from_str(&body).expect("Valid JSON");
        
        // Add assertions to verify all files are returned
        // This will depend on your exact response structure
    })
}

#[test]
fn test_invalid_endpoint() {
    run_test!(|client, _conn| async {
        let response = client.get("/invalid_endpoint").dispatch().await;
        
        // Should return 404 Not Found
        assert_eq!(response.status(), Status::NotFound);
    })
}

// Add more tests for your application's specific functionality:
// 1. Test file upload if applicable
// 2. Test file deletion
// 3. Test folder creation/navigation
// 4. Test error handling