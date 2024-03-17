use aws_config::SdkConfig;
use aws_sdk_dynamodb::operation::get_item::{GetItemError, GetItemOutput};
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::Client;
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::Repository;

#[derive(Deserialize, FromRow, Serialize)]
pub struct Recipe {
    id: Uuid,
    name: String,
}

impl Default for Recipe {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            name: "Basic Recipe".to_owned(),
        }
    }
}

impl TryFrom<GetItemOutput> for Recipe {
    type Error = StatusCode;

    fn try_from(value: GetItemOutput) -> Result<Self, Self::Error> {
        let attribute_map = value.item().ok_or(StatusCode::NOT_FOUND)?;

        let id_attr_as_str = attribute_map
            .get("id")
            .ok_or(StatusCode::NOT_FOUND)?
            .as_s()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let name = attribute_map
            .get("name")
            .ok_or(StatusCode::NOT_FOUND)?
            .as_s()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .to_owned();

        let id = Uuid::try_parse(id_attr_as_str.as_str())
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(Self {
            id,
            name,
        })
    }
}

#[derive(Clone)]
pub(super) struct DynamoDbRecipeRepository {
    client: Client,
    table_name: String,
}

impl DynamoDbRecipeRepository {
    pub(super) fn new(sdk_config: &SdkConfig, table_name: &str) -> Self {
        Self {
            client: Client::new(sdk_config),
            table_name: table_name.to_owned(),
        }
    }
}

impl Repository<Recipe> for DynamoDbRecipeRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Recipe, StatusCode> {
        let get_item_result = self
            .client
            .get_item()
            .table_name(&self.table_name)
            .key("id", AttributeValue::S(id.as_hyphenated().to_string()))
            .send()
            .await
            .map_err(|sdk_err| match sdk_err.into_service_error() {
                GetItemError::ResourceNotFoundException(_) => StatusCode::NOT_FOUND,
                GetItemError::RequestLimitExceeded(_) => StatusCode::TOO_MANY_REQUESTS,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            })?;

        Recipe::try_from(get_item_result)
    }
}
