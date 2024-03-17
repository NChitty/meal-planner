use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
pub struct CreateRecipe {
    pub(crate) name: String
}

#[cfg(test)]
mod test {
    use super::CreateRecipe;

    const JSON: &str = r#"{
        "name": "Basic Recipe"
    }"#;

    const STRUCT: CreateRecipe = CreateRecipe {
        name: "Basic Recipe".to_owned()
    };

    #[test]
    fn deserialize_create_recipe_request() {
        let deserialize_result: CreateRecipe = serde_json::from_str(JSON).unwrap();

        assert_eq!(STRUCT, deserialize_result);
    }
}
