// Updated cache_files.rs
use moka::sync::Cache;
use rocket::futures::lock::Mutex;
use rocket::http::{ContentType, Header};
use rocket::response::Responder;
use rocket::Request;
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use crate::models::file::repository::FileSchema;

pub type ImageCache = Arc<Cache<String, Vec<u8>>>;

pub struct CachedImage(pub Vec<u8>, pub Option<ContentType>, pub Option<Duration>);

impl CachedImage {
    // Constructor with default values
    // pub fn new(data: Vec<u8>) -> Self {
    //     CachedImage(data, None, None)
    // }

    // Constructor with content type
    // pub fn with_content_type(data: Vec<u8>, content_type: ContentType) -> Self {
    //     CachedImage(data, Some(content_type), None)
    // }

    // Constructor with content type and cache duration
    pub fn with_cache(data: Vec<u8>, content_type: ContentType, cache_duration: Duration) -> Self {
        CachedImage(data, Some(content_type), Some(cache_duration))
    }
}

impl<'r> Responder<'r, 'static> for CachedImage {
    fn respond_to(self, _: &'r Request<'_>) -> rocket::response::Result<'static> {
        // Calculate the ETag before we move self.0 into the cursor
        let etag = calculate_etag(&self.0);
        let data_len = self.0.len();

        let mut binding = rocket::Response::build();
        let mut response = binding
            .sized_body(data_len, Cursor::new(self.0));

        // Add Content-Type header if provided
        if let Some(content_type) = self.1 {
            response = response.header(content_type);
        }

        // Add caching headers
        let cache_duration = self.2.unwrap_or(Duration::from_secs(3600)); // Default to 1 hour
        let seconds = cache_duration.as_secs();

        // Cache-Control header
        let cache_control = format!("public, max-age={}", seconds);
        response = response.header(Header::new("Cache-Control", cache_control));

        // ETag header - we calculated this earlier
        let etag_value = format!("\"{}\"", etag);
        response = response.header(Header::new("ETag", etag_value));

        // Expires header
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
        let expiry_time = now + cache_duration;
        let expiry_secs = expiry_time.as_secs();

        // Format the Expires header in RFC 7231 format
        let expiry_date = format_http_date(expiry_secs);
        response = response.header(Header::new("Expires", expiry_date));

        // Add Last-Modified header - use current time
        let modified_date = format_http_date(now.as_secs());
        response = response.header(Header::new("Last-Modified", modified_date));

        response.ok()
    }
}

// Helper function to calculate a simple ETag value
fn calculate_etag(data: &[u8]) -> String {
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// Helper function to format HTTP date according to RFC 7231
fn format_http_date(secs: u64) -> String {
    use chrono::{TimeZone, Utc};

    let dt = Utc.timestamp_opt(secs as i64, 0).single()
        .unwrap_or_else(|| Utc::now());

    // Format according to RFC 7231
    dt.format("%a, %d %b %Y %H:%M:%S GMT").to_string()
}

pub struct StateFiles {
    pub files: Mutex<HashMap<String, Vec<FileSchema>>>,
}