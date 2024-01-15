use uuid::Uuid;

pub mod recipe;

pub trait Repository<T>: Send + Sync {
    fn find_by_id(&self, id: Uuid) -> Option<T>;
}
