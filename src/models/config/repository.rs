use crate::DbConn;
use crate::models::config::model::config;
use diesel::{ExpressionMethods, QueryDsl, QueryResult, RunQueryDsl};
use rocket::serde::{Deserialize, Serialize};

#[derive(
    Serialize, AsChangeset, Queryable, Insertable, Identifiable, Clone, Hash, Eq, PartialEq,
)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = config)]
pub struct ConfigSchema {
    #[serde(skip_deserializing)]
    pub id: i32,
    pub random_equal_folders: i32,
    pub photo_per_random: i32,
    pub folders_per_page: i32,
    pub equal_enabled: bool,
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
    pub async fn get_config(conn: &DbConn) -> QueryResult<ConfigSchema> {
        conn.run(move |c| {
            config::table
                .filter(config::id.eq(1))
                .first::<ConfigSchema>(c)
        })
        .await
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
        conn.run(move |c| {
            let t = ConfigSchema {
                id: 1,
                random_equal_folders: config.random_equal_folders,
                photo_per_random: config.photo_per_random,
                folders_per_page: config.folders_per_page,
                equal_enabled: config.equal_enabled,
            };

            // Try to insert first
            let insert_result = diesel::insert_into(config::table).values(&t).execute(c);

            match insert_result {
                Ok(rows) => {
                    // If insert succeeded, return the result
                    Ok(rows)
                }
                Err(_) => {
                    // If insert failed (likely because the record exists),
                    // perform an update based on the hash
                    diesel::update(config::table)
                        .filter(config::id.eq(1))
                        .set((
                            config::random_equal_folders.eq(config.random_equal_folders),
                            config::equal_enabled.eq(config.equal_enabled),
                            config::folders_per_page.eq(config.folders_per_page),
                            config::photo_per_random.eq(config.photo_per_random),
                        ))
                        .execute(c)
                }
            }
        })
        .await
    }
}
