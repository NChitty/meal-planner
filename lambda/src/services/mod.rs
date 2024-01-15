use axum::Router;
use axum::routing::get;

mod recipes;
pub fn recipes() -> Router {
    Router::new()
        .route("/:id", get(recipes::read_one))
}
