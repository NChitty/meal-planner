use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub mod mapper;
pub mod repository;
pub mod request_models;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Recipe {
    pub(crate) id: Uuid,
    pub(crate) name: String,
}

impl Default for Recipe {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            name: "Basic Recipe".to_owned(),
        }
    }
}
