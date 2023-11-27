use serde::{Deserialize, Serialize};
use uuid::{uuid, Uuid};

mod repository;

#[derive(Deserialize, Serialize)]
pub struct Recipe {
    id: Uuid,
    name: String,
}
