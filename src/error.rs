// src/error.rs
use rocket::http::Status;
use rocket::response::{self, Responder};
use rocket::serde::Serialize;
use rocket::serde::json::Json;
use std::fmt;
use tracing::{error, info, warn};

#[derive(Debug)]
pub enum AppError {
    DatabaseError(diesel::result::Error),
    IoError(std::io::Error),
    ImageError(image::ImageError),
    NotFound(String),
    BadRequest(String),
    #[allow(dead_code)]
    InternalError(String),
    #[allow(dead_code)]
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
            Self::DatabaseError(e) => write!(f, "Database error: {e}"),
            Self::IoError(e) => write!(f, "IO error: {e}"),
            Self::ImageError(e) => write!(f, "Image processing error: {e}"),
            Self::NotFound(msg) => write!(f, "Not found: {msg}"),
            Self::BadRequest(msg) => write!(f, "Bad request: {msg}"),
            Self::InternalError(msg) => write!(f, "Internal error: {msg}"),
            Self::Unauthorized(msg) => write!(f, "Unauthorized: {msg}"),
            Self::ValidationError(msg) => write!(f, "Validation error: {msg}"),
        }
    }
}

impl<'r> Responder<'r, 'static> for AppError {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'static> {
        let (status, error_msg, show_details) = match &self {
            Self::NotFound(_msg) => {
                info!(
                    error = %self,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "Resource not found"
                );
                (Status::NotFound, self.to_string(), true)
            }
            Self::BadRequest(_msg) => {
                warn!(
                    error = %self,
                    path = %req.uri().path(),
                    method = %req.method(),
                    ip = ?req.real_ip().or_else(|| req.client_ip()),
                    "Bad request"
                );
                (Status::BadRequest, self.to_string(), true)
            }
            Self::Unauthorized(_msg) => {
                warn!(
                    error = %self,
                    path = %req.uri().path(),
                    method = %req.method(),
                    ip = ?req.real_ip().or_else(|| req.client_ip()),
                    "Unauthorized access attempt"
                );
                (Status::Unauthorized, self.to_string(), true)
            }
            Self::ValidationError(_msg) => {
                info!(
                    error = %self,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "Validation error"
                );
                (Status::UnprocessableEntity, self.to_string(), true)
            }
            Self::DatabaseError(db_err) => {
                error!(
                    error = %self,
                    db_error = %db_err,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "Database error occurred"
                );
                (
                    Status::InternalServerError,
                    "Internal server error".to_string(),
                    false,
                )
            }
            Self::IoError(io_err) => {
                error!(
                    error = %self,
                    io_error = %io_err,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "IO error occurred"
                );
                (
                    Status::InternalServerError,
                    "Internal server error".to_string(),
                    false,
                )
            }
            Self::ImageError(img_err) => {
                error!(
                    error = %self,
                    image_error = %img_err,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "Image processing error occurred"
                );
                (
                    Status::InternalServerError,
                    "Internal server error".to_string(),
                    false,
                )
            }
            Self::InternalError(_msg) => {
                error!(
                    error = %self,
                    path = %req.uri().path(),
                    method = %req.method(),
                    "Internal application error"
                );
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
            diesel::result::Error::NotFound => Self::NotFound("Record not found".to_string()),
            _ => Self::DatabaseError(error),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::IoError(error)
    }
}

impl From<image::ImageError> for AppError {
    fn from(error: image::ImageError) -> Self {
        Self::ImageError(error)
    }
}

impl From<std::str::ParseBoolError> for AppError {
    fn from(error: std::str::ParseBoolError) -> Self {
        Self::ValidationError(format!("Invalid boolean value: {error}"))
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(error: std::num::ParseIntError) -> Self {
        Self::ValidationError(format!("Invalid integer value: {error}"))
    }
}

impl From<std::str::Utf8Error> for AppError {
    fn from(error: std::str::Utf8Error) -> Self {
        Self::ValidationError(format!("Invalid UTF-8 string: {error}"))
    }
}

impl From<std::string::FromUtf8Error> for AppError {
    fn from(error: std::string::FromUtf8Error) -> Self {
        Self::ValidationError(format!("Invalid UTF-8 string: {error}"))
    }
}

// Helper type alias
pub type AppResult<T> = Result<T, AppError>;

// Helper functions for common error patterns
impl AppError {
    pub fn not_found(resource: &str) -> Self {
        Self::NotFound(format!("{resource} not found"))
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    #[allow(dead_code)]
    pub fn internal(message: impl Into<String>) -> Self {
        Self::InternalError(message.into())
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::ValidationError(message.into())
    }
}
