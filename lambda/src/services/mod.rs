use axum::Router;
use axum::routing::get;
use crate::services::recipes::TestRecipeRepository;

mod recipes;

#[derive(Clone)]
struct ApplicationContext<T> {
    pub repo: T,
}

pub fn recipes() -> Router {
    let recipe_context = ApplicationContext {
        repo: TestRecipeRepository {}
    };

    Router::new()
        .route("/:id", get(recipes::read_one::<TestRecipeRepository>))
        .with_state(recipe_context)
}
