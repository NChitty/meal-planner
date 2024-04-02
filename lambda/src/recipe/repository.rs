use aws_config::SdkConfig;
use aws_sdk_dynamodb::operation::delete_item::DeleteItemError;
use aws_sdk_dynamodb::operation::get_item::GetItemError;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::Client;
use axum::http::StatusCode;
use serde_dynamo::aws_sdk_dynamodb_1::{from_item, to_item};
use uuid::Uuid;

use super::Recipe;
use crate::Repository;

#[derive(Clone)]
pub struct DynamoDbRecipe {
    client: Client,
    table_name: String,
}

impl DynamoDbRecipe {
    #[must_use]
    pub fn new(sdk_config: &SdkConfig, table_name: &str) -> Self {
        Self {
            client: Client::new(sdk_config),
            table_name: table_name.to_owned(),
        }
    }
}

impl Repository<Recipe> for DynamoDbRecipe {
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
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            })?;
        let item = get_item_result
            .item()
            .ok_or(StatusCode::NOT_FOUND)?
            .to_owned();

        let recipe = from_item(item).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(recipe)
    }

    async fn save(&self, recipe: &Recipe) -> Result<(), StatusCode> {
        let item = to_item(recipe).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        self.client
            .put_item()
            .table_name(&self.table_name)
            .set_item(Some(item))
            .send()
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(())
    }

    async fn delete_by_id(&self, id: Uuid) -> Result<(), StatusCode> {
        self.client
            .delete_item()
            .table_name(&self.table_name)
            .key("id", AttributeValue::S(id.as_hyphenated().to_string()))
            .condition_expression("attribute_exists(id)")
            .send()
            .await
            .map_err(|sdk_err| match sdk_err.into_service_error() {
                DeleteItemError::ResourceNotFoundException(_) => StatusCode::NOT_FOUND,
                DeleteItemError::ConditionalCheckFailedException(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            })?;

        Ok(())
    }
}
