use aws_config::BehaviorVersion;
use axum::{routing::{delete, get, post}, Router};
use meal_planner::{recipe::repository::DynamoDbRecipe, services::{recipes, ApplicationContext}};
use tracing::{info, instrument};

#[instrument(name = "recipes")]
pub async fn recipes() -> Router {
    info!("Initializing routes for recipes");
    let sdk_config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let table_name = std::env::var("RECIPE_TABLE_NAME")
        .ok()
        .unwrap_or("recipes".to_string());

    let repo = DynamoDbRecipe::new(&sdk_config, &table_name);
    let recipe_context = ApplicationContext { repo };

    Router::new()
        .route("/", post(recipes::create::<DynamoDbRecipe>))
        .route("/:id", get(recipes::read_one::<DynamoDbRecipe>))
        .route("/:id", delete(recipes::delete_one::<DynamoDbRecipe>))
        .with_state(recipe_context)
}
