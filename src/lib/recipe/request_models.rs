use serde::{Deserialize, Deserializer};

#[derive(Debug, Deserialize, PartialEq)]
pub struct PostRecipe {
    pub(super) name: String,
}

#[derive(Debug, Deserialize, PartialEq)]
pub struct PatchRecipe {
    #[serde(default, deserialize_with = "deserialize_option_string")]
    pub(super) name: Option<String>,
}

fn deserialize_option_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let option: Option<String> = Option::deserialize(deserializer)?;
    Ok(option.filter(|s| !s.is_empty()))
}

#[cfg(test)]
mod test {
    use super::PostRecipe;
    use crate::recipe::request_models::PatchRecipe;

    const JSON: &str = r#"{
        "name": "Basic Recipe"
    }"#;

    const NAME: &str = "Basic Recipe";

    #[test]
    fn deserialize_post_recipe_request() {
        let actual: PostRecipe = serde_json::from_str(JSON).unwrap();
        let expected = PostRecipe {
            name: NAME.to_owned(),
        };

        assert_eq!(expected, actual);
    }

    #[test]
    fn deserialize_post_recipe_request_none() {
        assert!(serde_json::from_str::<PostRecipe>("{}").is_err());
    }

    #[test]
    fn deserialize_patch_recipe_request_some() {
        let actual: PatchRecipe = serde_json::from_str(JSON).unwrap();
        let expected = PatchRecipe {
            name: Some(NAME.to_owned()),
        };

        assert_eq!(expected, actual);
    }

    #[test]
    fn deserialize_patch_recipe_request_none() {
        let actual: PatchRecipe = serde_json::from_str("{}").unwrap();
        let expected = PatchRecipe { name: None };

        assert_eq!(expected, actual);
    }

    #[test]
    fn deserialize_patch_recipe_request_none_empty() {
        let actual: PatchRecipe = serde_json::from_str("{\"name\": \"\"}").unwrap();
        let expected = PatchRecipe { name: None };

        assert_eq!(expected, actual);
    }
}
