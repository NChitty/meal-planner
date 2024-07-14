use uuid::Uuid;

use super::request_models::{PatchRecipe, PostRecipe};
use super::Recipe;

pub fn to_recipe(id: Uuid, value: &PostRecipe) -> Recipe {
    Recipe {
        id,
        name: value.name.clone(),
    }
}

pub fn update_recipe(recipe: &mut Recipe, value: &PatchRecipe) {
    if let Some(new_name) = &value.name {
        recipe.name = new_name.to_string();
    }
}

#[cfg(test)]
mod test {
    use uuid::Uuid;

    use super::Recipe;
    use crate::recipe::mapper;
    use crate::recipe::request_models::{PatchRecipe, PostRecipe};

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

    #[test]
    fn update_from_request() {
        let update_request = PatchRecipe {
            name: Some(NAME.to_owned()),
        };

        let mut recipe = Recipe {
            id: ID,
            name: "Will change".to_owned(),
        };

        mapper::update_recipe(&mut recipe, &update_request);

        assert_eq!(
            Recipe {
                id: ID,
                name: NAME.to_owned()
            },
            recipe
        );
    }

    #[test]
    fn update_from_request_none() {
        let update_request = PatchRecipe {
            name: None,
        };

        let mut recipe = Recipe {
            id: ID,
            name: NAME.to_owned(),
        };

        mapper::update_recipe(&mut recipe, &update_request);

        assert_eq!(
            Recipe {
                id: ID,
                name: NAME.to_owned() },
            recipe
        );
    }
}
