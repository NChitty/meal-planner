use serde::{Deserialize, Serialize};
use uuid::Uuid;

use self::request_models::CreateRecipe;

pub mod request_models;
pub mod repository;

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct Recipe {
    id: Uuid,
    name: String,
}

impl Recipe {
    pub fn create_new(id: Uuid, value: &CreateRecipe) -> Self {
        Self {
            id,
            name: value.name.to_owned(),
        }
    }
}

impl Default for Recipe {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            name: "Basic Recipe".to_owned(),
        }
    }
}

#[cfg(test)]
mod test {
    use uuid::Uuid;

    use super::{request_models::CreateRecipe, Recipe};

    const ID: Uuid = Uuid::nil();
    const NAME: &str = "Name";

    #[test]
    fn create_from_request() {
        let create_request = CreateRecipe {
            name: NAME.to_owned()
        };

        let recipe = Recipe::create_new(Uuid::nil(), &create_request);

        assert_eq!(Recipe { id: ID, name: NAME.to_owned() }, recipe);
    }
}
