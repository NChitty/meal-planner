use axum::routing::get;
use axum::Router;
use tracing::{info, instrument};

use crate::credentials_provider::{self, DatabaseCredentials};
use crate::services::recipes::PostgresRecipeRepository;

mod recipes;

#[derive(Clone)]
struct ApplicationContext<T> {
    pub repo: T,
}

#[instrument(name = "recipes")]
pub async fn recipes() -> Router {
    info!("Initializing recipe service");
    let db_credentials: DatabaseCredentials = credentials_provider::get_credentials().await;
    let connection_string = db_credentials.get_connection_string();

    let repo = PostgresRecipeRepository::new(&connection_string).await;
    let recipe_context = ApplicationContext { repo };

    Router::new()
        .route("/:id", get(recipes::read_one::<PostgresRecipeRepository>))
        .with_state(recipe_context)
}
