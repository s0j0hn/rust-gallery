use crate::DbConn;
use crate::models::file::model::files;
use diesel::{self, prelude::*, sql_types};
use rocket::serde::Serialize;
use rocket::serde::json::serde_json;
use std::collections::HashSet;

#[derive(
    Serialize, AsChangeset, Queryable, Insertable, Identifiable, Clone, Hash, Eq, PartialEq,
)]
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
    pub root: String,
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
    pub root: String,
}

#[derive(Queryable, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct FolderInfo {
    pub folder_name: String,
    pub count: i64,
    pub root: String,
}

#[derive(Queryable, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct FolderRootsInfo {
    pub count: i64,
    pub root: String,
    pub f_count: i64,
}

#[derive(Queryable, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct FileUpdateTags {
    pub hash: String,
    pub tags: Option<String>,
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
    pub async fn all_by_folder(conn: &DbConn, folder_name: String) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            files::table
                .filter(files::folder_name.eq(folder_name))
                .load::<FileSchema>(c)
        })
        .await
    }

    pub async fn all_by_tag(conn: &DbConn, tag: String) -> QueryResult<Vec<FileSchema>> {
        let search_pattern = format!("%{}%", tag);
        conn.run(move |c| {
            files::table
                .filter(files::tags.like(search_pattern))
                .load::<FileSchema>(c)
        })
        .await
    }

    pub async fn all_hashes(conn: &DbConn) -> QueryResult<Vec<String>> {
        conn.run(move |c| files::table.select(files::hash).load::<String>(c))
            .await
    }

    pub async fn random(
        conn: &DbConn,
        folder_name: String,
        size: i64,
        root: String,
        tag: String,
        extension: String,
    ) -> QueryResult<Vec<FileSchema>> {
        conn.run(move |c| {
            let mut query = files::table.into_boxed();

            // Apply filters based on parameters
            if tag != "*" {
                query = query.filter(files::tags.like("%\"".to_owned() + &tag + "\"%"));
            }

            if folder_name != "*" {
                query = query.filter(files::folder_name.eq(folder_name));
            }

            if root != "*" {
                query = query.filter(files::root.eq(root));
            }

            if extension != "*" {
                query = query.filter(files::extention.eq(extension))
            }

            // Apply ordering and limit
            query
                .order(random())
                .distinct()
                .limit(size)
                .load::<FileSchema>(c)
        })
        .await
    }

    pub async fn get_random_equal(
        conn: &DbConn,
        size: i64,
        root: String,
        folders_size: i64,
    ) -> QueryResult<Vec<FileSchema>> {
        let random_folders = Self::get_random_folders(conn, root, folders_size).await?;
        let mut random_equal_files: HashSet<FileSchema> = HashSet::new();

        for folder in random_folders {
            let folder_name = folder.clone();
            let files = conn
                .run(move |c| {
                    files::table
                        .order(random())
                        .filter(files::folder_name.eq(folder_name))
                        .limit(size / folders_size)
                        .load::<FileSchema>(c)
                })
                .await
                .unwrap_or(vec![]);

            random_equal_files.extend(files);
        }

        println!("Files length: {}", random_equal_files.len());

        Ok(random_equal_files.into_iter().collect())
    }

    pub async fn get_random_folders(
        conn: &DbConn,
        root: String,
        size: i64,
    ) -> QueryResult<Vec<String>> {
        conn.run(move |c| {
            files::table
                .select(files::folder_name)
                .filter(files::root.eq(root))
                .order(random())
                .distinct()
                .limit(size)
                .load::<String>(c)
        })
        .await
    }

    pub async fn get_folders(
        conn: &DbConn,
        search_by: String,
        root: String,
        max_results: i64,
        offset: i64,
    ) -> QueryResult<Vec<FolderInfo>> {
        conn.run(move |c| {
            files::table
                .group_by((files::folder_name, files::root))
                .select((
                    files::folder_name,
                    diesel::dsl::count(files::folder_name),
                    files::root,
                ))
                .filter(files::folder_name.like(search_by))
                .filter(files::root.eq(root))
                .offset(offset)
                .limit(max_results)
                .load::<FolderInfo>(c)
        })
        .await
    }

    pub async fn get_folders_roots(conn: &DbConn) -> QueryResult<Vec<FolderRootsInfo>> {
        conn.run(move |c| {
            files::table
                .group_by(files::root)
                .select((
                    diesel::dsl::count(files::root),
                    files::root,
                    diesel::dsl::count(files::folder_name),
                ))
                .load::<FolderRootsInfo>(c)
        })
        .await
    }

    pub async fn get_folder_by_name(conn: &DbConn, name: String) -> QueryResult<Vec<FolderInfo>> {
        conn.run(move |c| {
            files::table
                .group_by((files::folder_name, files::root))
                .select((
                    files::folder_name,
                    diesel::dsl::count(files::folder_name),
                    files::root,
                ))
                .filter(files::folder_name.eq(name))
                .load::<FolderInfo>(c)
        })
        .await
    }

    pub async fn get_roots(conn: &DbConn) -> QueryResult<Vec<String>> {
        conn.run(move |c| {
            diesel::QueryDsl::distinct(files::table.select(files::root)).load::<String>(c)
        })
        .await
    }

    pub async fn get_all_tags(conn: &DbConn, folder_name: String) -> QueryResult<Vec<String>> {
        conn.run(|c| {
            let mut query = files::table.into_boxed();

            // Apply filters based on parameters
            if folder_name != "*" {
                query = query.filter(files::folder_name.eq(folder_name));
            }

            // Get all non-null tag columns
            let all_tags: Vec<Option<String>> = query
                .select(files::tags)
                .filter(files::tags.is_not("[]"))
                .load(c)?;

            // Process the tags more efficiently
            let mut unique_tags = HashSet::new();

            for tags_option in all_tags.into_iter().flatten() {
                if let Ok(tags_array) = serde_json::from_str::<Vec<String>>(&tags_option) {
                    for tag in tags_array {
                        unique_tags.insert(tag);
                    }
                }
            }

            Ok(unique_tags.into_iter().collect())
        })
        .await
    }

    pub async fn count_all(conn: &DbConn) -> QueryResult<i64> {
        conn.run(move |c| files::table.count().get_result(c)).await
    }

    pub async fn count_by_folder(conn: &DbConn, folder_name: String) -> QueryResult<i64> {
        conn.run(move |c| {
            files::table
                .filter(files::folder_name.eq(folder_name))
                .count()
                .get_result(c)
        })
        .await
    }

    pub async fn get_by_hash(hash: String, conn: &DbConn) -> QueryResult<FileSchema> {
        conn.run(move |c| {
            files::table
                .filter(files::hash.eq(hash))
                .first::<FileSchema>(c)
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

    fn process_tags(tags: Vec<String>) -> String {
        let unique_tags: HashSet<&str> = tags.iter().map(|t| t.trim()).collect();
        let unique_tags_vec: Vec<&str> = unique_tags.into_iter().collect();
        serde_json::to_string(&unique_tags_vec).unwrap_or_else(|_| "[]".to_string())
    }

    pub async fn add_tags(
        conn: &DbConn,
        file_hash: String,
        new_tags: Vec<String>,
    ) -> QueryResult<usize> {
        let json_tags = Self::process_tags(new_tags);
        conn.run(move |c| {
            diesel::update(files::table)
                .filter(files::hash.eq(file_hash))
                .set(files::tags.eq(json_tags))
                .execute(c)
        })
        .await
    }

    pub async fn add_tags_folder(
        conn: &DbConn,
        folder_name: String,
        new_tags: Vec<String>,
    ) -> QueryResult<usize> {
        let json_tags = Self::process_tags(new_tags);
        conn.run(move |c| {
            diesel::update(files::table)
                .filter(files::folder_name.eq(folder_name))
                .set(files::tags.eq(json_tags))
                .execute(c)
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
                filename: image.filename.to_lowercase(),
                folder_name: image.folder_name.to_lowercase(),
                width: image.width,
                height: image.height,
                tags: None,
                root: image.root,
            };
            diesel::insert_or_ignore_into(files::table)
                .values(&t)
                .execute(c)
        })
        .await
    }

    pub async fn delete_folder_with_name(name: String, conn: &DbConn) -> QueryResult<usize> {
        conn.run(move |c| {
            diesel::delete(files::table)
                .filter(files::folder_name.eq(name))
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

    pub async fn update(image: Image, conn: &DbConn) -> QueryResult<usize> {
        conn.run(move |c| {
            let t = FileSchema {
                id: None,
                path: image.path,
                hash: image.hash,
                extention: image.extention,
                filename: image.filename.to_lowercase(),
                folder_name: image.folder_name.to_lowercase(),
                width: image.width,
                height: image.height,
                tags: None,
                root: image.root.to_lowercase(),
            };
            diesel::insert_into(files::table)
                .values(&t)
                .on_conflict(files::hash)
                .do_update()
                .set(&t)
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
