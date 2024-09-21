use std::collections::HashMap;
use std::sync::Arc;

use aws_config::SdkConfig;
use aws_sdk_dynamodb::operation::delete_item::DeleteItemError;
use aws_sdk_dynamodb::operation::get_item::GetItemError;
use aws_sdk_dynamodb::types::AttributeValue;
use axum::http::StatusCode;
use serde_dynamo::aws_sdk_dynamodb_1::{from_item, to_item};
use uuid::Uuid;

use super::Recipe;
use crate::aws_client::{DynamoDbClient, DynamoDbClientImpl};
use crate::Repository;

#[derive(Clone)]
pub struct DynamoDbRecipe {
    client: Arc<dyn DynamoDbClient>,
    table_name: String,
}

impl DynamoDbRecipe {
    #[must_use]
    pub fn new(sdk_config: &SdkConfig, table_name: &str) -> Self {
        Self {
            client: Arc::new(DynamoDbClientImpl::new(sdk_config)),
            table_name: table_name.to_owned(),
        }
    }

    #[allow(dead_code)]
    fn mock(client: Arc<dyn DynamoDbClient>, table_name: &str) -> Self {
        Self {
            client,
            table_name: table_name.to_owned(),
        }
    }
}

impl Repository<Recipe> for DynamoDbRecipe {
    async fn get_all(&self) -> Result<Vec<Recipe>, StatusCode> {
        let scan_result = self
            .client
            .scan(&self.table_name)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let items: Vec<Recipe> = scan_result
            .items()
            .iter()
            .map(|item| from_item(item.clone()))
            .flatten()
            .collect();

        Ok(items)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Recipe, StatusCode> {
        let get_item_result = self
            .client
            .get_item(&self.table_name, DynamoDbRecipe::get_key(id))
            .await
            .map_err(|err| match err {
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

    async fn save(&self, recipe: &Recipe) -> Result<Option<Recipe>, StatusCode> {
        let item = to_item(recipe).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let output = self
            .client
            .put_item(&self.table_name, item)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        return match output.attributes {
            Some(item) => from_item(item).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR),
            None => Ok(None),
        }
    }

    async fn delete_by_id(&self, id: Uuid) -> Result<(), StatusCode> {
        self.client
            .delete_item(&self.table_name, DynamoDbRecipe::get_key(id))
            .await
            .map_err(|err| match err {
                DeleteItemError::ConditionalCheckFailedException(_)
                | DeleteItemError::ResourceNotFoundException(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            })?;

        Ok(())
    }
}

impl DynamoDbRecipe {
    fn get_key(id: Uuid) -> HashMap<String, AttributeValue> {
        let mut key = HashMap::new();
        key.insert(
            "id".to_string(),
            AttributeValue::S(id.as_hyphenated().to_string()),
        );

        key
    }
}

#[cfg(test)]
mod test {

    use aws_sdk_dynamodb::operation::delete_item::DeleteItemOutput;
    use aws_sdk_dynamodb::operation::get_item::GetItemOutput;
    use aws_sdk_dynamodb::operation::put_item::{PutItemError, PutItemOutput};
    use aws_sdk_dynamodb::operation::scan::ScanOutput;
    use aws_sdk_dynamodb::types::error::{
        ConditionalCheckFailedException,
        ResourceNotFoundException,
    };
    use mockall::predicate::eq;

    use super::*;
    use crate::aws_client::MockDynamoDbClient as DynamoDbClient;

    #[tokio::test]
    async fn test_get_no_error() {
        let recipe = Recipe {
            id: Uuid::nil(),
            name: "Name".to_owned(),
        };
        let item = to_item(&recipe).unwrap();
        let mut mock = DynamoDbClient::default();
        mock.expect_get_item()
            .with(eq("recipes"), eq(DynamoDbRecipe::get_key(Uuid::nil())))
            .return_once(|_, _| Ok(GetItemOutput::builder().set_item(Some(item)).build()));

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.find_by_id(Uuid::nil()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), recipe);
    }

    #[tokio::test]
    async fn test_get_not_found() {
        let mut mock = DynamoDbClient::default();
        mock.expect_get_item()
            .with(eq("recipes"), eq(DynamoDbRecipe::get_key(Uuid::nil())))
            .return_once(|_, _| {
                Err(GetItemError::ResourceNotFoundException(
                    ResourceNotFoundException::builder().build(),
                ))
            });

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.find_by_id(Uuid::nil()).await;
        assert!(result.is_err());
        let test = match result {
            Err(StatusCode::NOT_FOUND) => true,
            _ => false,
        };
        assert!(test);
    }

    #[tokio::test]
    async fn test_save() {
        let recipe = Recipe {
            id: Uuid::nil(),
            name: "Name".to_owned(),
        };
        let item = to_item(&recipe).unwrap();
        let mut mock = DynamoDbClient::default();
        mock.expect_put_item()
            .with(eq("recipes"), eq(item.clone()))
            .return_once(move |_, _| {
                Ok(PutItemOutput::builder()
                    .set_attributes(Some(item.clone()))
                    .build())
            });

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        assert!(repo.save(&recipe).await.is_ok())
    }

    #[tokio::test]
    async fn test_save_error() {
        let recipe = Recipe {
            id: Uuid::nil(),
            name: "Name".to_owned(),
        };
        let item = to_item(&recipe).unwrap();
        let mut mock = DynamoDbClient::default();
        mock.expect_put_item()
            .with(eq("recipes"), eq(item.clone()))
            .return_once(move |_, _| {
                Err(PutItemError::ResourceNotFoundException(
                    ResourceNotFoundException::builder().build(),
                ))
            });

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.save(&recipe).await;
        assert!(result.is_err_and(|err| match err {
            StatusCode::INTERNAL_SERVER_ERROR => true,
            _ => false,
        }))
    }

    #[tokio::test]
    async fn test_delete() {
        let mut mock = DynamoDbClient::default();
        mock.expect_delete_item()
            .with(eq("recipes"), eq(DynamoDbRecipe::get_key(Uuid::nil())))
            .return_once(move |_, _| Ok(DeleteItemOutput::builder().build()));

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.delete_by_id(Uuid::nil()).await;
        assert!(result.is_ok())
    }

    #[tokio::test]
    async fn test_delete_error_resource_not_found() {
        let mut mock = DynamoDbClient::default();
        mock.expect_delete_item()
            .with(eq("recipes"), eq(DynamoDbRecipe::get_key(Uuid::nil())))
            .return_once(move |_, _| {
                Err(DeleteItemError::ResourceNotFoundException(
                    ResourceNotFoundException::builder().build(),
                ))
            });

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.delete_by_id(Uuid::nil()).await;
        assert!(result.is_err_and(|err| match err {
            StatusCode::NOT_FOUND => true,
            _ => false,
        }))
    }

    #[tokio::test]
    async fn test_delete_error_condition_unmet() {
        let mut mock = DynamoDbClient::default();
        mock.expect_delete_item()
            .with(eq("recipes"), eq(DynamoDbRecipe::get_key(Uuid::nil())))
            .return_once(move |_, _| {
                Err(DeleteItemError::ConditionalCheckFailedException(
                    ConditionalCheckFailedException::builder().build(),
                ))
            });

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.delete_by_id(Uuid::nil()).await;
        assert!(result.is_err_and(|err| match err {
            StatusCode::NOT_FOUND => true,
            _ => false,
        }))
    }

    #[tokio::test]
    async fn test_scan() {
        let mut mock = DynamoDbClient::default();
        let recipe = Recipe {
            id: Uuid::nil(),
            name: "Name".to_owned(),
        };
        let item = to_item(&recipe).unwrap();
        mock.expect_scan()
            .with(eq("recipes"))
            .return_once(move |_| Ok(ScanOutput::builder().items(item).build()));

        let repo = DynamoDbRecipe::mock(Arc::new(mock), "recipes");

        let result = repo.get_all().await;
        assert!(result.is_ok_and(|collection| collection.contains(&recipe) && collection.len() == 1))
    }
}
