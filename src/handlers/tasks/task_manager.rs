
use rocket::futures::lock::Mutex;
use rocket::{tokio, State};
use rocket::tokio::task::JoinHandle;
use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use rocket::serde::json::Json;
use rocket::serde::Serialize;

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

    /// Checks if a task is currently running


    /// Requests cancellation of the current task
    pub fn request_cancellation(&self) {
        self.should_cancel.store(true, Ordering::SeqCst);
    }
}

// Define a response struct for the cancel_task endpoint
#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct JsonTaskCancelResponse {
    status: String,
    message: String,
    task_running: bool
}

#[get("/task/cancel")]
pub async fn cancel_task(
    thread_manager: &State<ThreadManager>,
) -> Json<JsonTaskCancelResponse> {
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
        Json(JsonTaskCancelResponse {
            status: "success".to_string(),
            message: "Indexation task has been canceled".to_string(),
            task_running: false
        })
    } else {
        // No task was running
        Json(JsonTaskCancelResponse {
            status: "info".to_string(),
            message: "No indexation task was running".to_string(),
            task_running: false
        })
    }
}