use tracing::Level;
use tracing_subscriber::{fmt::{self, format::FmtSpan, time::UtcTime}, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer, Registry};
use std::time::Duration;

/// Logging configuration for the application
#[derive(Debug, Clone)]
pub struct LogConfig {
    pub log_level: String,
    pub structured_logs: bool,
    pub include_span_events: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            log_level: "info".to_string(),
            structured_logs: false,
            include_span_events: true,
        }
    }
}

/// Initialize the logging system for console-only output
pub fn init_logging(config: LogConfig) -> Result<(), Box<dyn std::error::Error>> {
    // Parse log level
    let level = parse_log_level(&config.log_level)?;

    // Create environment filter
    let env_filter = EnvFilter::builder()
        .with_default_directive(level.into())
        .from_env_lossy()
        // Add specific filters for noisy dependencies
        .add_directive("hyper=warn".parse()?)
        .add_directive("tokio=info".parse()?)
        .add_directive("rocket=info".parse()?)
        .add_directive("diesel=warn".parse()?);

    let registry = Registry::default().with(env_filter);

    // Console only logging
    let mut console_layer = fmt::Layer::new()
        .with_writer(std::io::stdout)
        .with_timer(UtcTime::rfc_3339())
        .with_target(true)
        .with_thread_ids(false)
        .with_file(true)
        .with_line_number(true);

    // Configure span events
    if config.include_span_events {
        console_layer = console_layer.with_span_events(FmtSpan::CLOSE);
    } else {
        console_layer = console_layer.with_span_events(FmtSpan::NONE);
    }

    let console_layer = if config.structured_logs {
        console_layer.json().boxed()
    } else {
        console_layer.pretty().boxed()
    };

    if let Err(e) = registry.with(console_layer).try_init() {
        eprintln!("Warning: Logging already initialized: {}", e);
        return Ok(()); // Return OK if already initialized
    }

    tracing::info!("Logging system initialized with level: {}", config.log_level);

    Ok(())
}

/// Parse log level string to tracing Level
fn parse_log_level(level: &str) -> Result<Level, Box<dyn std::error::Error>> {
    match level.to_lowercase().as_str() {
        "trace" => Ok(Level::TRACE),
        "debug" => Ok(Level::DEBUG),
        "info" => Ok(Level::INFO),
        "warn" | "warning" => Ok(Level::WARN),
        "error" => Ok(Level::ERROR),
        _ => Err(format!("Invalid log level: {}", level).into()),
    }
}

/// Logging utilities for the application
pub mod utils {
    use tracing::{info, warn, error};
    use std::time::{Duration, Instant};

    /// Log a timed operation
    pub async fn log_operation<F, T, E>(
        operation_name: &str,
        operation: F,
    ) -> Result<T, E>
    where
        F: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Display,
    {
        let start = Instant::now();
        info!("Starting operation: {}", operation_name);

        let result = operation.await;
        let duration = start.elapsed();

        match &result {
            Ok(_) => {
                info!(
                    "Operation completed successfully: {} (took {:?})",
                    operation_name, duration
                );
            }
            Err(e) => {
                error!(
                    "Operation failed: {} - {} (took {:?})",
                    operation_name, e, duration
                );
            }
        }

        result
    }

    /// Log performance metrics
    pub fn log_performance_metric(metric_name: &str, value: f64, unit: &str) {
        info!(
            metric_name = metric_name,
            value = value,
            unit = unit,
            "Performance metric recorded"
        );
    }

    /// Log slow operation warning
    pub fn log_slow_operation(operation: &str, duration: Duration, threshold: Duration) {
        if duration > threshold {
            warn!(
                operation = operation,
                duration_ms = duration.as_millis(),
                threshold_ms = threshold.as_millis(),
                "Slow operation detected"
            );
        }
    }
}

/// Request logging middleware data
#[derive(Debug, Clone)]
pub struct RequestMetrics {
    pub method: String,
    pub path: String,
    pub status: u16,
    pub duration: Duration,
    pub bytes_sent: Option<u64>,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
}

impl RequestMetrics {
    pub fn log(&self) {
        tracing::info!(
            method = %self.method,
            path = %self.path,
            status = self.status,
            duration_ms = self.duration.as_millis(),
            bytes_sent = self.bytes_sent,
            user_agent = %self.user_agent.as_deref().unwrap_or("unknown"),
            ip = %self.ip_address.as_deref().unwrap_or("unknown"),
            "HTTP request processed"
        );

        // Log slow requests
        if self.duration.as_millis() > 1000 {
            tracing::warn!(
                method = %self.method,
                path = %self.path,
                duration_ms = self.duration.as_millis(),
                "Slow request detected"
            );
        }

        // Log error responses
        if self.status >= 400 {
            if self.status >= 500 {
                tracing::error!(
                    target: "http_errors",
                    method = %self.method,
                    path = %self.path,
                    status = self.status,
                    "HTTP error response"
                );
            } else {
                tracing::warn!(
                    target: "http_errors",
                    method = %self.method,
                    path = %self.path,
                    status = self.status,
                    "HTTP error response"
                );
            }
        }
    }
}

/// Database operation logging
pub mod db_logging {
    use tracing::{warn, error, debug};
    use std::time::Duration;

    pub fn log_query_start(query: &str, params: Option<&str>) {
        debug!(
            query = query,
            params = params,
            "Database query starting"
        );
    }

    pub fn log_query_complete(query: &str, duration: Duration, rows_affected: Option<usize>) {
        if duration.as_millis() > 100 {
            warn!(
                query = query,
                duration_ms = duration.as_millis(),
                rows_affected = rows_affected,
                "Slow database query"
            );
        } else {
            debug!(
                query = query,
                duration_ms = duration.as_millis(),
                rows_affected = rows_affected,
                "Database query completed"
            );
        }
    }

    pub fn log_query_error(query: &str, error: &str, duration: Duration) {
        error!(
            query = query,
            error = error,
            duration_ms = duration.as_millis(),
            "Database query failed"
        );
    }
}

/// Cache operation logging
pub mod cache_logging {
    use tracing::{info, debug};

    pub fn log_cache_hit(key: &str, cache_type: &str) {
        debug!(
            key = key,
            cache_type = cache_type,
            "Cache hit"
        );
    }

    pub fn log_cache_miss(key: &str, cache_type: &str) {
        debug!(
            key = key,
            cache_type = cache_type,
            "Cache miss"
        );
    }

    pub fn log_cache_set(key: &str, cache_type: &str, ttl: Option<u64>) {
        debug!(
            key = key,
            cache_type = cache_type,
            ttl = ttl,
            "Cache entry set"
        );
    }

    pub fn log_cache_eviction(key: &str, cache_type: &str, reason: &str) {
        info!(
            key = key,
            cache_type = cache_type,
            reason = reason,
            "Cache entry evicted"
        );
    }

    pub fn log_cache_stats(cache_type: &str, hit_rate: f64, size: usize, capacity: usize) {
        info!(
            cache_type = cache_type,
            hit_rate = hit_rate,
            size = size,
            capacity = capacity,
            "Cache statistics"
        );
    }
}