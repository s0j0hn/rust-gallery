use rocket::serde::Serialize;
use crate::models::config::model::config;

#[derive(Serialize, AsChangeset, Queryable, Insertable, Identifiable, Clone, Hash, Eq, PartialEq)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = config)]
pub struct ConfigSchema {
    #[serde(skip_deserializing)]
    pub id: Option<i32>,
    pub random_equal_folders: i32,
}

impl ConfigSchema {
    
}