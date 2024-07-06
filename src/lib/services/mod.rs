pub mod recipes;

#[derive(Clone)]
pub struct ApplicationContext<T> {
    pub repo: T,
}
