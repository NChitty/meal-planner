use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

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
