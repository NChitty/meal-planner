use uuid::Uuid;

use super::{request_models::PostRecipe, Recipe};

#[must_use]
pub fn to_recipe(id: Uuid, value: &PostRecipe) -> Recipe {
    Recipe {
        id,
        name: value.name.clone(),
    }
}

#[cfg(test)]
mod test {
    use uuid::Uuid;

    use crate::recipe::{mapper, request_models::PostRecipe};
    use super::Recipe;

    const ID: Uuid = Uuid::nil();
    const NAME: &str = "Name";

    #[test]
    fn create_from_request() {
        let create_request = PostRecipe {
            name: NAME.to_owned(),
        };

        let recipe = mapper::to_recipe(Uuid::nil(), &create_request);

        assert_eq!(
            Recipe {
                id: ID,
                name: NAME.to_owned()
            },
            recipe
        );
    }
}
