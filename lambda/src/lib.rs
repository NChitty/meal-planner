use std::future::Future;

use sqlx::database;
use uuid::Uuid;

pub mod recipe;
pub mod services;
pub mod credentials_provider;

pub trait Repository<T>: Send + Sync {
    fn find_by_id(&self, id: Uuid) -> impl Future<Output = Option<T>>;
}
