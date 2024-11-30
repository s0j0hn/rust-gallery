use rocket::futures::lock::Mutex;
use rocket::{tokio, State};
use rocket::tokio::task::JoinHandle;
use std::future::Future;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use rocket_dyn_templates::Template;
use crate::Context;

pub struct ThreadManager {
    pub task: Arc<Mutex<Option<JoinHandle<()>>>>,
    thread_count: Arc<AtomicUsize>,
    pub should_cancel: Arc<AtomicBool>,
}

impl ThreadManager {
    #[must_use]
    pub fn new() -> Self {
        Self {
            thread_count: Arc::new(AtomicUsize::new(0)),
            should_cancel: Arc::new(AtomicBool::new(false)),
            task: Mutex::new(None).into(),
        }
    }

    pub fn spawn<T>(&self, future: T) -> JoinHandle<<T as Future>::Output>
    where
        T: Future + Send + 'static,
        T::Output: Send + 'static,
    {
        // Increment the count before spawning the task
        self.thread_count.fetch_add(1, Ordering::SeqCst);

        let count = Arc::clone(&self.thread_count);
        let run_task = Arc::clone(&self.task);

        return tokio::spawn(async move {
            let result = future.await;
            // Decrement the count after the task completes
            count.fetch_sub(1, Ordering::SeqCst);
            run_task.lock().await.take();
            result
        });
    }
}

#[get("/index/cancel_task")]
pub async fn cancel_task(thread_manager: &State<ThreadManager>) -> Template {
    thread_manager.should_cancel.store(true, Ordering::SeqCst);

    let mut task_guard = thread_manager.task.lock().await;
    if let Some(task) = task_guard.take() {
        task.abort();

        Template::render(
            "tasks",
            Context {
                flash: Some(("error".into(), "Task cancellation requested.".into())),
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
                flash: Some(("error".into(), "Task not running".into())),
                files: vec![],
                folders: vec![],
                count_files: 0,
                roots: vec![],
                tags: vec![],
            },
        )
    }
}