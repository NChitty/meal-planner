use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::recipe::Recipe;
use crate::services::ApplicationContext;
use crate::Repository;

#[derive(Clone)]
pub(super) struct TestRecipeRepository {}

impl Repository<Recipe> for TestRecipeRepository {
    fn find_by_id(&self, id: Uuid) -> Option<Recipe> {
        if id.is_nil() {
            return Some(Recipe::default());
        }
        None
    }
}

pub(super) async fn read_one<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    if let Some(recipe) = state.repo.find_by_id(id) {
        return Ok(Json(recipe));
    }

    Err(StatusCode::NOT_FOUND)
}
