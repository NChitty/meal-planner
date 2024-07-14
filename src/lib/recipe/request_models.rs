use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
pub struct PostRecipe {
    pub(super) name: String,
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct PatchRecipe {
    pub(crate) name: String,
}

#[cfg(test)]
mod test {
    use super::PostRecipe;

    const JSON: &str = r#"{
        "name": "Basic Recipe"
    }"#;

    const NAME: &str = "Basic Recipe";

    #[test]
    fn deserialize_create_recipe_request() {
        let actual: PostRecipe = serde_json::from_str(JSON).unwrap();
        let expected = PostRecipe {
            name: NAME.to_owned(),
        };

        assert_eq!(expected, actual);
    }
}
