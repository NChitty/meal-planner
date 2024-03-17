use serde::{Deserialize, Serialize};
use uuid::Uuid;

use self::request_models::CreateRecipe;

pub mod repository;
pub mod request_models;

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct Recipe {
    id: Uuid,
    name: String,
}

impl Recipe {
    #[must_use]
    pub fn create_new(id: Uuid, value: &CreateRecipe) -> Self {
        Self {
            id,
            name: value.name.clone(),
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

    use super::request_models::CreateRecipe;
    use super::Recipe;

    const ID: Uuid = Uuid::nil();
    const NAME: &str = "Name";

    #[test]
    fn create_from_request() {
        let create_request = CreateRecipe {
            name: NAME.to_owned(),
        };

        let recipe = Recipe::create_new(Uuid::nil(), &create_request);

        assert_eq!(
            Recipe {
                id: ID,
                name: NAME.to_owned()
            },
            recipe
        );
    }
}
