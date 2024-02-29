use std::time::Duration;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Error, PgPool};
use uuid::Uuid;

use crate::recipe::Recipe;
use crate::services::ApplicationContext;
use crate::Repository;

#[derive(Clone)]
pub(super) struct PostgresRecipeRepository {
    pool: PgPool,
}

impl PostgresRecipeRepository {
    pub(super) async fn new(url: &String) -> Self {
        let pool: PgPool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(3))
            .connect(&url)
            .await
            .expect("Can\'t connect to database");

        Self { pool }
    }
}

impl Repository<Recipe> for PostgresRecipeRepository {
    async fn find_by_id(&self, id: Uuid) -> Option<Recipe> {
        let result: Result<Recipe, Error> = sqlx::query_as("SELECT * FROM recipes WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await;

        match result {
            Ok(recipe) => Some(recipe),
            Err(err) => {
                dbg!(err);
                None
            },
        }
    }
}

pub(super) async fn read_one<T>(
    State(state): State<ApplicationContext<T>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Recipe>, StatusCode>
where
    T: Repository<Recipe>,
{
    if let Some(recipe) = state.repo.find_by_id(id).await {
        return Ok(Json(recipe));
    }

    Err(StatusCode::NOT_FOUND)
}
