use crate::error::AppResult;
use crate::handlers::files::utils::walk_directory;
use crate::{AppConfig, DbConn};
use rocket::futures::lock::Mutex;
use rocket::serde::Serialize;
use rocket::serde::json::Json;
use rocket::tokio::task::JoinHandle;
use rocket::{State, tokio};
use std::future::Future;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// Manages background task execution and cancellation
pub struct ThreadManager {
    // The currently running task, if any
    pub task: Arc<Mutex<Option<JoinHandle<()>>>>,
    // Flag to signal that the current task should be cancelled
    pub should_cancel: Arc<AtomicBool>,
    pub last_indexed: Arc<Mutex<Option<u64>>>, // Timestamp of last indexation
}

impl Default for ThreadManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreadManager {
    #[must_use]
    pub fn new() -> Self {
        Self {
            should_cancel: Arc::new(AtomicBool::new(false)),
            task: Arc::new(Mutex::new(None)),
            last_indexed: Arc::new(Mutex::new(None)),
        }
    }

    /// Spawns a new task and tracks it for potential cancellation
    pub fn spawn<T, O>(&self, future: T) -> JoinHandle<O>
    where
        T: Future<Output = O> + Send + 'static,
        O: Send + 'static,
    {
        // Reset cancellation flag when starting a new task
        self.should_cancel.store(false, Ordering::SeqCst);

        //let should_cancel = Arc::clone(&self.should_cancel);
        let task_holder = Arc::clone(&self.task);

        tokio::spawn(async move {
            // The actual task execution
            let result = future.await;

            // Clean up the task reference when done
            // Use try_lock to avoid deadlock if there's contention
            if let Some(mut guard) = task_holder.try_lock() {
                *guard = None;
            }

            result
        })
    }
}

// Define a response struct for the cancel_task endpoint
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonTaskCancelResponse {
    status: String,
    message: String,
    task_running: bool,
}

#[get("/task/cancel")]
pub async fn cancel_task(
    thread_manager: &State<ThreadManager>,
) -> AppResult<Json<JsonTaskCancelResponse>> {
    let mut task_guard = thread_manager.task.lock().await;

    if task_guard.is_some() {
        // Signal the task to cancel
        thread_manager.should_cancel.store(true, Ordering::SeqCst);

        // Wait for a short time to allow the task to respond to cancellation
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Abort the task (this is a forceful way to stop it)
        if let Some(task) = task_guard.take() {
            task.abort();
        }

        // Return success JSON response
        Ok(Json(JsonTaskCancelResponse {
            status: "success".to_string(),
            message: "Indexation task has been canceled".to_string(),
            task_running: false,
        }))
    } else {
        // No task was running
        Ok(Json(JsonTaskCancelResponse {
            status: "info".to_string(),
            message: "No indexation task was running".to_string(),
            task_running: false,
        }))
    }
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonTaskIndexResponse {
    status: String,
    task_running: bool,
    message: String,
    last_indexed: Option<u64>, // Added field for last indexed timestamp
}

#[get("/task/index?<force>")]
pub async fn index_files(
    config: &State<AppConfig>,
    conn: DbConn,
    thread_manager: &State<ThreadManager>,
    force: Option<&str>,
) -> AppResult<Json<JsonTaskIndexResponse>> {
    let force_param = force.unwrap_or("false").trim();

    // Validate force parameter
    if !force_param.is_empty() && force_param != "true" && force_param != "false" {
        return Err(crate::error::AppError::validation(
            "Force parameter must be 'true' or 'false'",
        ));
    }

    let force_write = force_param.parse::<bool>().unwrap_or(false);

    let mut task_guard = thread_manager.task.lock().await;
    let task_running = task_guard.is_some();

    // If task is not running, start a new one
    if !task_running {
        let should_cancel = thread_manager.should_cancel.clone();
        should_cancel.store(false, Ordering::SeqCst);

        let images_dirs = config.images_dirs.clone();

        // Get the last indexed timestamp (don't use if force_write is true)
        let last_indexed = if force_write {
            None
        } else {
            // Safely get the current value
            thread_manager
                .last_indexed
                .lock()
                .await
                .as_ref()
                .map(|timestamp| *timestamp)
        };

        // Clone the Mutex/Arc instead of taking a reference
        let last_indexed_mutex = thread_manager.last_indexed.clone();

        let task = thread_manager.spawn(async move {
            if should_cancel.load(Ordering::SeqCst) {
                return;
            }

            for images_dir in images_dirs {
                walk_directory(&images_dir, &conn, &force_write, last_indexed).await
            }

            // Update the last_indexed timestamp after completion
            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            *last_indexed_mutex.lock().await = Some(current_time);
        });

        *task_guard = Some(task);
    }

    // For the response, get the current last_indexed value
    let last_indexed_value = *thread_manager.last_indexed.lock().await;

    // Return JSON response with task status
    Ok(Json(JsonTaskIndexResponse {
        status: "success".to_string(),
        task_running,
        message: if task_running {
            "Indexation task is already running".to_string()
        } else {
            "Started new indexation task".to_string()
        },
        last_indexed: last_indexed_value,
    }))
}
