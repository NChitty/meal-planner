use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::recipe::request_models::CreateRecipe;
use crate::recipe::Recipe;
use crate::services::ApplicationContext;
use crate::Repository;

pub(super) async fn read_one<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    let recipe = state.repo.find_by_id(id).await?;

    Ok(Json(recipe))
}

pub(super) async fn create<T>(
    State(state): State<ApplicationContext<T>>,
    Json(payload): Json<CreateRecipe>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    let recipe = Recipe::create_new(Uuid::new_v4(), &payload);
    state.repo.save(&recipe).await?;

    Ok(Json(recipe))
}
