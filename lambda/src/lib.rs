use std::future::Future;

use axum::http::StatusCode;
use uuid::Uuid;

pub mod recipe;
pub mod services;

pub trait Repository<T>: Send + Sync {
    fn find_by_id(&self, id: Uuid) -> impl Future<Output = Result<T, StatusCode>> + Send;
    fn save(&self, item: &T) -> impl Future<Output = Result<(), StatusCode>> + Send;
    fn delete_by_id(&self, id: Uuid) -> impl Future<Output = Result<(), StatusCode>> + Send;
}
