use diesel::{self, prelude::*, sql_types};
use rocket::serde::Serialize;

mod schema {
    table! {
        files {
            id -> Nullable<Integer>,
            path -> Text,
            hash -> Text,
            extention -> Text,
            filename -> Text,
            folder_name -> Text,
            width -> Integer,
            height -> Integer,
            tags -> Nullable<Text>,
        }
    }
}

use self::schema::files;

use crate::DbConn;

#[derive(Serialize, Queryable, Insertable, Debug, Clone)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = files)]
pub struct FileSchema {
    #[serde(skip_deserializing)]
    pub id: Option<i32>,
    pub path: String,
    pub hash: String,
    pub extention: String,
    pub filename: String,
    pub folder_name: String,
    pub width: i32,
    pub height: i32,
    pub tags: Option<String>,
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
#[derive(Debug, FromForm)]
pub struct Image {
    pub path: String,
    pub hash: String,
    pub extention: String,
    pub filename: String,
    pub folder_name: String,
    pub width: i32,
    pub height: i32,
}

// Represents the SQL RANDOM() function
define_sql_function!(fn random() -> sql_types::Integer);

impl FileSchema {
    pub async fn all_paged(
        conn: &DbConn,
        max_results: i64,
        offset: i64,
        folder_name: String,
    ) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            files::table
                .filter(files::folder_name.eq(folder_name))
                .offset(offset)
                .limit(max_results)
                .load::<FileSchema>(c)
        })
            .await
    }
    pub async fn all_by_folder(
        conn: &DbConn,
        folder_name: String,
    ) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            files::table
                .filter(files::folder_name.eq(folder_name))
                .load::<FileSchema>(c)
        })
            .await
    }

    pub async fn all_hashes(
        conn: &DbConn,
    ) -> QueryResult<Vec<String>> {
        conn.run(move |c| {
            files::table
                .select(files::hash)
                .load::<String>(c)
        })
            .await
    }

    pub async fn random(
        conn: &DbConn,
        folder_name: String,
        size: i64,
    ) -> QueryResult<Vec<FileSchema>> {
        if folder_name == "*" {
            conn.run(move |c| {
                files::table
                    .order(random())
                    .limit(size)
                    .load::<FileSchema>(c)
            })
                .await
        } else {
            conn.run(move |c| {
                files::table
                    .order(random())
                    .filter(files::folder_name.eq(folder_name))
                    .limit(size)
                    .load::<FileSchema>(c)
            })
                .await
        }
    }

    pub async fn get_folders(conn: &DbConn, search_by: String) -> QueryResult<Vec<String>> {
        conn.run(move |c| {
            files::table
                .select(files::folder_name)
                .filter(files::folder_name.like(search_by))
                .distinct()
                .load::<String>(c)
        })
        .await
    }

    pub async fn count_all(conn: &DbConn) -> QueryResult<usize> {
        conn.run(move |c| files::table.count().execute(c))
            .await
    }

    pub async fn count_by_folder(conn: &DbConn, folder_name: String) -> QueryResult<usize> {
        conn.run(move |c| {
            files::table
                .filter(files::folder_name.eq(folder_name))
                .count().execute(c)
        })
            .await
    }

    pub async fn get_by_hash(hash: String, conn: &DbConn) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            files::table
                .filter(files::hash.eq(hash))
                .load::<FileSchema>(c)
        })
        .await
    }

    pub async fn get_by_path(path: String, conn: &DbConn) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            files::table
                .filter(files::path.eq(path))
                .load::<FileSchema>(c)
        })
        .await
    }

    /// Returns the number of affected rows: 1.
    pub async fn insert(image: Image, conn: &DbConn) -> QueryResult<usize> {
        conn.run(move |c| {
            let t = FileSchema {
                id: None,
                path: image.path,
                hash: image.hash,
                extention: image.extention,
                filename: image.filename,
                folder_name: image.folder_name,
                width: image.width,
                height: image.height,
                tags: None,
            };
            diesel::insert_or_ignore_into(files::table)
                .values(&t)
                .execute(c)
        })
        .await
    }

    /// Returns the number of affected rows: 1.
    pub async fn delete_with_id(id: i32, conn: &DbConn) -> QueryResult<usize> {
        conn.run(move |c| {
            diesel::delete(files::table)
                .filter(files::id.eq(id))
                .execute(c)
        })
        .await
    }

    /// Returns the number of affected rows.
    #[cfg(test)]
    pub async fn delete_all(conn: &DbConn) -> QueryResult<usize> {
        conn.run(|c| diesel::delete(files::table).execute(c)).await
    }
}
