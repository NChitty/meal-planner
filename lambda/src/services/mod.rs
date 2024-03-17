use aws_config::BehaviorVersion;
use axum::routing::{get, post};
use axum::Router;
use tracing::{info, instrument};

use crate::recipe::repository::DynamoDbRecipeRepository;

mod recipes;

#[derive(Clone)]
struct ApplicationContext<T> {
    pub repo: T,
}

#[instrument(name = "recipes")]
pub async fn recipes() -> Router {
    info!("Initializing recipe service");
    let sdk_config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let table_name = std::env::var("RECIPE_TABLE_NAME")
        .ok()
        .unwrap_or("recipes".to_string());

    let repo = DynamoDbRecipeRepository::new(&sdk_config, &table_name);
    let recipe_context = ApplicationContext { repo };

    Router::new()
        .route("/:id", get(recipes::read_one::<DynamoDbRecipeRepository>))
        .route("/", post(recipes::create::<DynamoDbRecipeRepository>))
        .with_state(recipe_context)
}
