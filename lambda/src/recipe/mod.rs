use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Deserialize, FromRow, Serialize)]
pub struct Recipe {
    id: Uuid,
    name: String,
}

impl Default for Recipe {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            name: "Basic Recipe".to_owned(),
        }
    }
}
