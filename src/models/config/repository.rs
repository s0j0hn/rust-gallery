use crate::DbConn;
use crate::logging::db_logging;
use crate::models::config::model::config;
use diesel::{ExpressionMethods, QueryDsl, QueryResult, RunQueryDsl};
use rocket::serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Queryable, Insertable, Identifiable, Clone, Hash, Eq, PartialEq)]
#[diesel(table_name = config)]
pub struct ConfigSchemaRaw {
    pub id: Option<i32>,
    pub random_equal_folders: i32,
    pub photo_per_random: i32,
    pub folders_per_page: i32,
    pub equal_enabled: i32, // Raw integer from database
}

#[derive(Serialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct ConfigSchema {
    #[serde(skip_deserializing)]
    pub id: i32,
    pub random_equal_folders: i32,
    pub photo_per_random: i32,
    pub folders_per_page: i32,
    pub equal_enabled: bool,
}

impl From<ConfigSchemaRaw> for ConfigSchema {
    fn from(raw: ConfigSchemaRaw) -> Self {
        Self {
            id: raw.id.unwrap_or(1),
            random_equal_folders: raw.random_equal_folders,
            photo_per_random: raw.photo_per_random,
            folders_per_page: raw.folders_per_page,
            equal_enabled: raw.equal_enabled != 0, // Convert integer to boolean
        }
    }
}

impl From<ConfigInfo> for ConfigSchemaRaw {
    fn from(info: ConfigInfo) -> Self {
        Self {
            id: Some(1),
            random_equal_folders: info.random_equal_folders,
            photo_per_random: info.photo_per_random,
            folders_per_page: info.folders_per_page,
            equal_enabled: if info.equal_enabled { 1 } else { 0 }, // Convert boolean to integer
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct ConfigInfo {
    pub random_equal_folders: i32,
    pub photo_per_random: i32,
    pub folders_per_page: i32,
    pub equal_enabled: bool,
}

impl ConfigSchema {
    pub async fn get_config(conn: &DbConn) -> QueryResult<Self> {
        let start = Instant::now();
        let query = "SELECT * FROM config WHERE id = 1";
        db_logging::log_query_start(query, Some("id=1"));

        let result = conn
            .run(move |c| {
                config::table
                    .filter(config::id.eq(1))
                    .first::<ConfigSchemaRaw>(c)
                    .map(Self::from)
            })
            .await;

        let duration = start.elapsed();
        match &result {
            Ok(_) => db_logging::log_query_complete(query, duration, Some(1)),
            Err(e) => db_logging::log_query_error(query, &e.to_string(), duration),
        }

        result
    }
    // pub async fn update(conn: &DbConn, config: ConfigInfo) -> QueryResult<ConfigSchema> {
    //     conn.run(move |c| {
    //         let t = ConfigSchema {
    //             id: 1,
    //             random_equal_folders: config.random_equal_folders,
    //             photo_per_random: config.photo_per_random,
    //             folders_per_page: config.folders_per_page,
    //             equal_enabled: config.equal_enabled,
    //         };
    //         diesel::insert_into(config::table)
    //             .values(&t)
    //             .on_conflict(config::id)
    //             .do_update()
    //             .set(&t)
    //             .get_result(c)
    //     })
    //     .await
    // }

    pub async fn update(conn: &DbConn, config: ConfigInfo) -> QueryResult<usize> {
        let start = Instant::now();
        let query = "INSERT INTO config ... ON CONFLICT UPDATE";
        db_logging::log_query_start(query, Some(&format!("config: {config:?}")));

        let result = conn
            .run(move |c| {
                let t = ConfigSchemaRaw::from(config.clone());

                // Try to insert first
                let insert_result = diesel::insert_into(config::table).values(&t).execute(c);

                match insert_result {
                    Ok(rows) => {
                        // If insert succeeded, return the result
                        Ok(rows)
                    }
                    Err(_) => {
                        // If insert failed (likely because the record exists),
                        // perform an update based on the id
                        diesel::update(config::table)
                            .filter(config::id.eq(1))
                            .set((
                                config::random_equal_folders.eq(config.random_equal_folders),
                                config::equal_enabled.eq(if config.equal_enabled { 1 } else { 0 }),
                                config::folders_per_page.eq(config.folders_per_page),
                                config::photo_per_random.eq(config.photo_per_random),
                            ))
                            .execute(c)
                    }
                }
            })
            .await;

        let duration = start.elapsed();
        match &result {
            Ok(rows) => db_logging::log_query_complete(query, duration, Some(*rows)),
            Err(e) => db_logging::log_query_error(query, &e.to_string(), duration),
        }

        result
    }
}
