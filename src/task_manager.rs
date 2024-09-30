use std::future::Future;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use rocket::futures::lock::Mutex;
use rocket::tokio;
use rocket::tokio::task::JoinHandle;

pub struct ThreadManager {
    pub task: Mutex<Option<JoinHandle<()>>>,
    thread_count: Arc<AtomicUsize>,
    pub should_cancel: Arc<AtomicBool>,
}

impl ThreadManager {
    #[must_use]
    pub fn new() -> Self {
        Self {
            thread_count: Arc::new(AtomicUsize::new(0)),
            should_cancel: Arc::new(AtomicBool::new(false)),
            task: Mutex::new(None),
        }
    }

    pub fn spawn<T>(&self, future: T) -> JoinHandle<<T as Future>::Output>
    where T: Future + Send + 'static, T::Output: Send + 'static, {
        // Increment the count before spawning the task
        self.thread_count.fetch_add(1, Ordering::SeqCst);

        let count = Arc::clone(&self.thread_count);
        return tokio::spawn(async move {
            let result = future.await;
            // Decrement the count after the task completes
            count.fetch_sub(1, Ordering::SeqCst);
            result
        });
    }
}