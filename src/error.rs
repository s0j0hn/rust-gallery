// src/error.rs
use rocket::http::Status;
use rocket::response::{self, Responder};
use rocket::serde::Serialize;
use rocket::serde::json::Json;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    DatabaseError(diesel::result::Error),
    IoError(std::io::Error),
    ImageError(image::ImageError),
    NotFound(String),
    BadRequest(String),
    InternalError(String),
    Unauthorized(String),
    ValidationError(String),
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct ErrorResponse {
    error: String,
    code: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<String>,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::DatabaseError(e) => write!(f, "Database error: {e}"),
            AppError::IoError(e) => write!(f, "IO error: {e}"),
            AppError::ImageError(e) => write!(f, "Image processing error: {e}"),
            AppError::NotFound(msg) => write!(f, "Not found: {msg}"),
            AppError::BadRequest(msg) => write!(f, "Bad request: {msg}"),
            AppError::InternalError(msg) => write!(f, "Internal error: {msg}"),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {msg}"),
            AppError::ValidationError(msg) => write!(f, "Validation error: {msg}"),
        }
    }
}

impl<'r> Responder<'r, 'static> for AppError {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'static> {
        let (status, error_msg, show_details) = match &self {
            AppError::NotFound(_) => (Status::NotFound, self.to_string(), true),
            AppError::BadRequest(_) => (Status::BadRequest, self.to_string(), true),
            AppError::Unauthorized(_) => (Status::Unauthorized, self.to_string(), true),
            AppError::ValidationError(_) => (Status::UnprocessableEntity, self.to_string(), true),
            AppError::DatabaseError(_)
            | AppError::IoError(_)
            | AppError::ImageError(_)
            | AppError::InternalError(_) => {
                // Log the actual error for debugging
                error!("Internal error occurred: {}", self);
                (
                    Status::InternalServerError,
                    "Internal server error".to_string(),
                    false,
                )
            }
        };

        let error_response = ErrorResponse {
            error: if show_details {
                error_msg
            } else {
                "Internal server error".to_string()
            },
            code: status.code,
            details: if show_details {
                None
            } else {
                Some("Check server logs for details".to_string())
            },
        };

        response::status::Custom(status, Json(error_response)).respond_to(req)
    }
}

// Implement conversions
impl From<diesel::result::Error> for AppError {
    fn from(error: diesel::result::Error) -> Self {
        match error {
            diesel::result::Error::NotFound => AppError::NotFound("Record not found".to_string()),
            _ => AppError::DatabaseError(error),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error)
    }
}

impl From<image::ImageError> for AppError {
    fn from(error: image::ImageError) -> Self {
        AppError::ImageError(error)
    }
}

// Helper type alias
pub type AppResult<T> = Result<T, AppError>;

// Helper functions for common error patterns
impl AppError {
    pub fn not_found(resource: &str) -> Self {
        AppError::NotFound(format!("{resource} not found"))
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        AppError::BadRequest(message.into())
    }

    pub fn internal(message: impl Into<String>) -> Self {
        AppError::InternalError(message.into())
    }

    pub fn validation(message: impl Into<String>) -> Self {
        AppError::ValidationError(message.into())
    }
}
