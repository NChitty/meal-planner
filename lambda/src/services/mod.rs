use axum::routing::get;
use axum::Router;

use crate::services::recipes::PostgresRecipeRepository;

mod recipes;

#[derive(Clone)]
struct ApplicationContext<T> {
    pub repo: T,
}

pub async fn recipes() -> Router {
    let db_username = std::env::var("DB_USERNAME").unwrap_or_else(|_| "postgres".to_string());
    let db_password = std::env::var("DB_PASSWORD").unwrap_or_else(|_| "password1234".to_string());
    let db_host = std::env::var("DB_HOST").unwrap_or_else(|_| "db".to_string());
    let db_port = std::env::var("DB_PORT").unwrap_or_else(|_| "5432".to_string());
    let db_name = std::env::var("DB_NAME").unwrap_or_else(|_| "meal-planner".to_string());
    let db_connection_str = format!(
        "postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
    );

    let recipe_context = ApplicationContext {
        repo: PostgresRecipeRepository::new(&db_connection_str).await,
    };

    Router::new()
        .route("/:id", get(recipes::read_one::<PostgresRecipeRepository>))
        .with_state(recipe_context)
}
