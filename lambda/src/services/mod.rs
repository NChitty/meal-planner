use axum::routing::get;
use axum::Router;

use crate::credentials_provider::{self, DatabaseCredentials};
use crate::services::recipes::PostgresRecipeRepository;

mod recipes;

#[derive(Clone)]
struct ApplicationContext<T> {
    pub repo: T,
}

pub async fn recipes() -> Router {
    let db_credentials: DatabaseCredentials = credentials_provider::get_credentials();

    let recipe_context = ApplicationContext {
        repo: PostgresRecipeRepository::new(&db_credentials.get_connection_string()).await,
    };

    Router::new()
        .route("/:id", get(recipes::read_one::<PostgresRecipeRepository>))
        .with_state(recipe_context)
}
