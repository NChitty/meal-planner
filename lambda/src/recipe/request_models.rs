use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
pub struct CreateRecipe {
    pub(super) name: String
}

#[cfg(test)]
mod test {
    use super::CreateRecipe;

    const JSON: &str = r#"{
        "name": "Basic Recipe"
    }"#;

    const NAME: &str = "Basic Recipe";

    #[test]
    fn deserialize_create_recipe_request() {
        let actual: CreateRecipe = serde_json::from_str(JSON).unwrap();
        let expected = CreateRecipe {
            name: NAME.to_owned(),
        };

        assert_eq!(expected, actual);
    }
}
