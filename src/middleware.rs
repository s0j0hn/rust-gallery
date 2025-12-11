use rocket::{
    Data, Request, Response,
    fairing::{Fairing, Info, Kind},
    http::Header,
};
use std::time::{Duration, Instant};
use tracing::{debug, info, warn};

use crate::logging::RequestMetrics;

/// Request logging fairing that tracks HTTP requests
pub struct RequestLogger;

#[rocket::async_trait]
impl Fairing for RequestLogger {
    fn info(&self) -> Info {
        Info {
            name: "Request Logger",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        // Store request start time
        request.local_cache(RequestTimer::new);

        // Log incoming request
        debug!(
            method = %request.method(),
            uri = %request.uri(),
            headers = ?request.headers(),
            "Incoming request"
        );
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        // Get request start time
        let timer = request.local_cache(RequestTimer::new);
        let duration = timer.elapsed();

        // Extract request information
        let method = request.method().to_string();
        let path = request.uri().path().to_string();
        let status = response.status().code;

        // Extract headers
        let user_agent = request
            .headers()
            .get_one("User-Agent")
            .map(|s| s.to_string());

        let ip_address = request
            .real_ip()
            .or_else(|| request.client_ip())
            .map(|ip| ip.to_string());

        // Get response size if available
        let bytes_sent = response
            .headers()
            .get_one("content-length")
            .and_then(|s| s.parse::<u64>().ok());

        // Create and log metrics
        let metrics = RequestMetrics {
            method,
            path,
            status,
            duration,
            bytes_sent,
            user_agent,
            ip_address,
        };

        metrics.log();

        // Add response headers for debugging (in debug mode only)
        if cfg!(debug_assertions) {
            response.set_header(Header::new(
                "X-Response-Time-Ms",
                duration.as_millis().to_string(),
            ));
        }
    }
}

/// Timer to track request processing time
struct RequestTimer {
    start: Instant,
}

impl RequestTimer {
    fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }
}

/// Security logging fairing to detect and log suspicious activities
pub struct SecurityLogger;

#[rocket::async_trait]
impl Fairing for SecurityLogger {
    fn info(&self) -> Info {
        Info {
            name: "Security Logger",
            kind: Kind::Request,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        let uri = request.uri();
        let path = uri.path();
        let query = uri.query().map(|q| q.as_str()).unwrap_or("");

        // Check for suspicious patterns
        let suspicious_patterns = [
            "../",
            "..\\",
            "/etc/passwd",
            "/etc/shadow",
            "SELECT",
            "UNION",
            "DROP",
            "INSERT",
            "UPDATE",
            "DELETE",
            "<script",
            "javascript:",
            "onload=",
            "onerror=",
            "cmd.exe",
            "powershell",
            "/bin/bash",
            "/bin/sh",
        ];

        let full_request = format!("{path} {query}");

        for pattern in &suspicious_patterns {
            if full_request
                .to_lowercase()
                .contains(&pattern.to_lowercase())
            {
                warn!(
                    method = %request.method(),
                    uri = %uri,
                    ip = ?request.real_ip().or_else(|| request.client_ip()),
                    user_agent = ?request.headers().get_one("User-Agent"),
                    pattern = pattern,
                    "Suspicious request pattern detected"
                );
                break;
            }
        }

        // Log requests with unusual headers
        let headers = request.headers();
        if let Some(user_agent) = headers.get_one("User-Agent")
            && (user_agent.len() > 500 || user_agent.contains("curl") && !cfg!(debug_assertions))
        {
            warn!(
                method = %request.method(),
                uri = %uri,
                user_agent = user_agent,
                "Unusual user agent detected"
            );
        }

        // Log requests without user agent (potentially automated)
        if headers.get_one("User-Agent").is_none() {
            info!(
                method = %request.method(),
                uri = %uri,
                ip = ?request.real_ip().or_else(|| request.client_ip()),
                "Request without User-Agent header"
            );
        }
    }
}

/// Performance monitoring fairing
pub struct PerformanceMonitor;

#[rocket::async_trait]
impl Fairing for PerformanceMonitor {
    fn info(&self) -> Info {
        Info {
            name: "Performance Monitor",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let timer = request.local_cache(RequestTimer::new);
        let duration = timer.elapsed();

        // Define performance thresholds
        let slow_threshold = Duration::from_millis(1000);
        let very_slow_threshold = Duration::from_millis(5000);

        if duration > very_slow_threshold {
            warn!(
                method = %request.method(),
                uri = %request.uri(),
                duration_ms = duration.as_millis(),
                status = response.status().code,
                "Very slow request detected"
            );
        } else if duration > slow_threshold {
            warn!(
                method = %request.method(),
                uri = %request.uri(),
                duration_ms = duration.as_millis(),
                status = response.status().code,
                "Slow request detected"
            );
        }

        // Log database-heavy endpoints
        if request.uri().path().contains("/files/") || request.uri().path().contains("/folders/") {
            debug!(
                method = %request.method(),
                uri = %request.uri(),
                duration_ms = duration.as_millis(),
                "Database operation completed"
            );
        }
    }
}
