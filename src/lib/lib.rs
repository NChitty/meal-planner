use std::future::Future;

use axum::async_trait;
use axum::http::StatusCode;
use uuid::Uuid;

pub mod aws_client;
pub mod recipe;
pub mod services;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait Repository<T: Send + Sync>: Send + Sync {
    fn get_all(&self) -> impl Future<Output = Result<Vec<T>, StatusCode>> + Send;
    fn find_by_id(&self, id: Uuid) -> impl Future<Output = Result<T, StatusCode>> + Send;
    fn save(&self, item: &T) -> impl Future<Output = Result<(), StatusCode>> + Send;
    fn delete_by_id(&self, id: Uuid) -> impl Future<Output = Result<(), StatusCode>> + Send;
}
