use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::recipe::request_models::{PostRecipe, PatchRecipe};
use crate::recipe::{mapper, Recipe};
use crate::services::ApplicationContext;
use crate::Repository;

/// Attempts to create a recipe in the database.
///
/// # Errors
///
/// This function converts the result of the database operation to a status code
/// wrapped in an error.
pub async fn create<T>(
    State(state): State<ApplicationContext<T>>,
    Json(payload): Json<PostRecipe>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    let recipe = mapper::to_recipe(Uuid::new_v4(), &payload);
    state.repo.save(&recipe).await?;

    Ok(Json(recipe))
}

/// Attempts to find a recipe in the database given the uuid.
///
/// # Errors
///
/// This function converts the result of the database operation to a status code
/// wrapped in an error.
pub async fn read_one<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    let recipe = state.repo.find_by_id(id).await?;

    Ok(Json(recipe))
}

/// Attempts to update a recipe in the database given the uuid.
///
/// # Errors
///
/// This function converts the result of the database operation to a status code
/// wrapped in an error.
pub async fn update<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<PatchRecipe>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    let mut recipe = state.repo.find_by_id(id).await?;
    recipe.name = payload.name;

    state.repo.save(&recipe).await?;

    Ok(Json(recipe))
}

/// Attempts to delete a recipe in the database given the uuid.
///
/// # Errors
///
/// This function converts the result of the database operation to a status code
/// wrapped in an error.
pub async fn delete_one<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode>
where
    T: Repository<Recipe>,
{
    state.repo.delete_by_id(id).await?;

    Ok(StatusCode::NO_CONTENT)
}
