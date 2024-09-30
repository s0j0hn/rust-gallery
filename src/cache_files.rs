use rocket::response::Responder;
use rocket::Request;
use std::io::Cursor;
use rocket::futures::lock::Mutex;
use std::collections::HashMap;
use std::sync::Arc;
use moka::sync::Cache;
use crate::file_schema::FileSchema;

pub type ImageCache = Arc<Cache<String, Vec<u8>>>;

pub struct CachedImage(pub Vec<u8>);

impl<'r> Responder<'r, 'static> for CachedImage {
    fn respond_to(self, _: &'r Request<'_>) -> rocket::response::Result<'static> {
        rocket::Response::build()
            .sized_body(self.0.len(), Cursor::new(self.0))
            .ok()
    }
}

pub struct StateFiles {
    pub files: Mutex<HashMap<String, Vec<FileSchema>>>,
}