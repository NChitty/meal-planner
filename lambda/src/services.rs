pub(super) mod recipes {
    use axum::extract::{Path};
    use axum::http::StatusCode;
    use axum::Json;
    use lambda::recipe::Recipe;
    use uuid::Uuid;


    pub(crate) async fn read_one(
        Path(_): Path<Uuid>,
    ) -> Result<Json<Recipe>, StatusCode>
    where {
        Ok(Json(Recipe::default()))
    }
}
