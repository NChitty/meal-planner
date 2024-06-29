use std::collections::HashMap;

use aws_config::SdkConfig;
use aws_sdk_dynamodb::error::SdkError;
use aws_sdk_dynamodb::operation::delete_item::{DeleteItemError, DeleteItemOutput};
use aws_sdk_dynamodb::operation::get_item::{GetItemError, GetItemOutput};
use aws_sdk_dynamodb::operation::put_item::{PutItemError, PutItemOutput};
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::Client;
use axum::async_trait;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait DynamoDbClient: Send + Sync {
    async fn get_item(
        &self,
        table_name: &str,
        key: HashMap<String, AttributeValue>,
    ) -> Result<GetItemOutput, GetItemError>;
    async fn put_item(
        &self,
        table_name: &str,
        item: HashMap<String, AttributeValue>,
    ) -> Result<PutItemOutput, PutItemError>;

    async fn delete_item(
        &self,
        table_name: &str,
        key: HashMap<String, AttributeValue>,
    ) -> Result<DeleteItemOutput, DeleteItemError>;
}

#[derive(Clone)]
pub struct DynamoDbClientImpl(Client);

impl DynamoDbClientImpl {
    #[must_use]
    pub fn new(sdk_config: &SdkConfig) -> Self { Self(Client::new(sdk_config)) }
}

#[async_trait]
impl DynamoDbClient for DynamoDbClientImpl {
    async fn get_item(
        &self,
        table_name: &str,
        key: HashMap<String, AttributeValue>,
    ) -> Result<GetItemOutput, GetItemError> {
        self.0
            .get_item()
            .table_name(table_name)
            .set_key(Some(key))
            .send()
            .await
            .map_err(SdkError::into_service_error)
    }

    async fn put_item(
        &self,
        table_name: &str,
        item: HashMap<String, AttributeValue>,
    ) -> Result<PutItemOutput, PutItemError> {
        self.0
            .put_item()
            .table_name(table_name)
            .set_item(Some(item))
            .send()
            .await
            .map_err(SdkError::into_service_error)
    }

    async fn delete_item(
        &self,
        table_name: &str,
        key: HashMap<String, AttributeValue>,
    ) -> Result<DeleteItemOutput, DeleteItemError> {
        self.0
            .delete_item()
            .table_name(table_name)
            .set_key(Some(key))
            .condition_expression("attribute_exists(id)")
            .send()
            .await
            .map_err(SdkError::into_service_error)
    }
}
