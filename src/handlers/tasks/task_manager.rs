
use rocket::futures::lock::Mutex;
use rocket::{tokio, State};
use rocket::tokio::task::JoinHandle;
use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use rocket_dyn_templates::Template;
use crate::Context;

/// Manages background task execution and cancellation
pub struct ThreadManager {
    // The currently running task, if any
    pub task: Arc<Mutex<Option<JoinHandle<()>>>>,
    // Flag to signal that the current task should be cancelled
    pub should_cancel: Arc<AtomicBool>,
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

/// Web endpoint to cancel the currently running task
#[get("/index/cancel_task")]
pub async fn cancel_task(thread_manager: &State<ThreadManager>) -> Template {
    // Request cancellation first to set the flag
    thread_manager.request_cancellation();

    let was_running = {
        let mut task_guard = thread_manager.task.lock().await;
        if let Some(task) = task_guard.take() {
            // Abort the task and drop the guard
            task.abort();
            true
        } else {
            false
        }
    };

    if was_running {
        Template::render(
            "tasks",
            Context {
                flash: Some(("success".into(), "Task cancellation requested.".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    } else {
        Template::render(
            "tasks",
            Context {
                flash: Some(("info".into(), "No task was running.".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    }
}