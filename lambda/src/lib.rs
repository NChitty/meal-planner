use axum::http::StatusCode;
use uuid::Uuid;

pub mod credentials_provider;
pub mod recipe;
pub mod services;

pub trait Repository<T>: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<T, StatusCode>;
    async fn save(&self, item: &T) -> Result<(), StatusCode>;
}
