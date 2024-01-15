use uuid::Uuid;

pub mod recipe;
pub mod services;

pub trait Repository<T>: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Option<T>;
}
