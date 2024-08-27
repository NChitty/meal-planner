use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::recipe::request_models::{PatchRecipe, PostRecipe};
use crate::recipe::{mapper, Recipe};
use crate::services::ApplicationContext;
use crate::Repository;

/// Lists all recipes from the database.
///
/// # Errors
///
/// This function converts the result of the database operation to a status code
/// wrapped in an error.
pub async fn list<T>(
    State(state): State<ApplicationContext<T>>,
) -> Result<Json<Vec<Recipe>>, StatusCode>
where
    T: Repository<Recipe>,
{
    let recipes = state.repo.get_all().await?;

    Ok(Json(recipes))
}

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
    mapper::update_recipe(&mut recipe, &payload);

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

#[cfg(test)]
mod test {
    use axum::extract::{Path, State};
    use axum::http::StatusCode;
    use axum::Json;
    use mockall::predicate::{eq, function};
    use uuid::Uuid;

    use crate::recipe::request_models::PostRecipe;
    use crate::recipe::Recipe;
    use crate::services::{self, ApplicationContext};
    use crate::MockRepository;

    #[tokio::test]
    async fn create_ok() {
        let mut mock_repo: MockRepository<Recipe> = MockRepository::new();
        mock_repo
            .expect_save()
            .with(function(|recipe: &Recipe| recipe.name.eq("Name")))
            .return_once(|_| Box::pin(async { Ok(()) }));
        let state = State(ApplicationContext::<MockRepository<Recipe>> { repo: mock_repo });
        let payload = Json(PostRecipe::default());

        let actual = services::recipes::create(state, payload).await;

        assert!(actual.is_ok());
    }

    #[tokio::test]
    async fn create_error() {
        let mut mock_repo: MockRepository<Recipe> = MockRepository::new();
        mock_repo
            .expect_save()
            .with(function(|recipe: &Recipe| recipe.name.eq("Name")))
            .return_once(|_| Box::pin(async { Err(StatusCode::INTERNAL_SERVER_ERROR) }));
        let state = State(ApplicationContext::<MockRepository<Recipe>> { repo: mock_repo });
        let payload = Json(PostRecipe::default());

        let actual = services::recipes::create(state, payload).await;

        assert!(actual.is_err());
        assert_eq!(actual.err().unwrap(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[tokio::test]
    async fn read_one_ok() {
        let mut mock_repo: MockRepository<Recipe> = MockRepository::new();
        let expected = Recipe {
            id: Uuid::nil(),
            name: "Name".to_owned(),
        };
        let clone = expected.clone();
        mock_repo
            .expect_find_by_id()
            .with(eq(Uuid::nil()))
            .return_once(move |_| Box::pin(async move { Ok(clone) }));
        let state = State(ApplicationContext::<MockRepository<Recipe>> { repo: mock_repo });

        let actual = services::recipes::read_one(state, Path(Uuid::nil())).await;

        match actual {
            Ok(Json(returned_recipe)) => {
                assert_eq!(returned_recipe, expected);
            },
            _ => panic!("Expected Ok(Json(recipe)), got {:?}", actual),
        }
    }
}
