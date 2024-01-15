use axum::extract::Query;
use axum::response::Json;
use axum::routing::get;
use axum::Router;
use lambda_http::{run, Error};
use serde::Deserialize;
use serde_json::{json, Value};

mod services;

#[derive(Debug, Deserialize)]
struct Root {
    name: String,
}

async fn root(query: Option<Query<Root>>) -> Json<Value> {
    if let Some(query) = query {
        return Json(json!({ "msg": "Hello ".to_string() + &query.0.name + "!" }));
    }
    Json(json!({ "msg": "Hello world!" }))
}

async fn ping() -> Json<Value> { Json(json!({ "msg": "Pong" })) }

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    let app = Router::new()
        .route("/", get(root))
        .route("/ping", get(ping))
        .route("/recipes/:id", get(services::recipes::read_one));

    run(app).await
}
