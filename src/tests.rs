use super::file_schema::FileSchema;

use rand::{distributions::Alphanumeric, thread_rng, Rng};

use rocket::http::{ContentType, Status};
use rocket::local::asynchronous::Client;

// We use a lock to synchronize between tests so DB operations don't collide.
// For now. In the future, we'll have a nice way to run each test in a DB
// transaction so we can regain concurrency.
static DB_LOCK: parking_lot::Mutex<()> = parking_lot::const_mutex(());

macro_rules! run_test {
    (|$client:ident, $conn:ident| $block:expr) => {{
        let _lock = DB_LOCK.lock();

        rocket::async_test(async move {
            let $client = Client::tracked(super::rocket())
                .await
                .expect("Rocket client");
            let db = super::DbConn::get_one($client.rocket()).await;
            let $conn = db.expect("failed to get database connection for testing");
            FileSchema::delete_all(&$conn)
                .await
                .expect("failed to delete all files for testing");

            $block
        })
    }};
}

#[test]
fn test_index() {
    use rocket::local::blocking::Client;

    let _lock = DB_LOCK.lock();
    let client = Client::tracked(super::rocket()).unwrap();
    let response = client.get("/folders").dispatch();
    assert_eq!(response.status(), Status::Ok);
}

#[test]
fn test_index_search() {
    use rocket::local::blocking::Client;

    let _lock = DB_LOCK.lock();
    let client = Client::tracked(super::rocket()).unwrap();
    let response = client.get("/folders?searchby=alice").dispatch();
    assert_eq!(response.status(), Status::Ok);
}
