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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct ConfigInfo {
    pub random_equal_folders: i32,
}

impl ConfigSchema {
    pub async fn get_config(conn: &DbConn) -> QueryResult<Vec<ConfigSchema>> {
        conn.run(move |c| {
            config::table
                .filter(config::id.eq(1))
                .load::<ConfigSchema>(c)
        })
        .await
    }
    pub async fn update(conn: &DbConn, config: ConfigInfo) -> QueryResult<usize> {
        conn.run(move |c| {
            let t = ConfigSchema {
                id: 1,
                random_equal_folders: config.random_equal_folders,
            };
            diesel::insert_into(config::table)
                .values(&t)
                .on_conflict(config::id)
                .do_update()
                .set(&t)
                .execute(c)
        })
        .await
    }
}
