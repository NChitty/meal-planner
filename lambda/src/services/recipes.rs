use axum::extract::Path;
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::recipe::Recipe;

pub(super) async fn read_one(Path(_): Path<Uuid>) -> Result<Json<Recipe>, StatusCode> {
    Ok(Json(Recipe::default()))
}
