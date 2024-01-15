use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
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
