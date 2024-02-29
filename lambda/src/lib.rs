use std::future::Future;

use uuid::Uuid;

pub mod credentials_provider;
pub mod recipe;
pub mod services;

pub trait Repository<T>: Send + Sync {
    fn find_by_id(&self, id: Uuid) -> impl Future<Output = Option<T>>;
}
