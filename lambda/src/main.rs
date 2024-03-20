use axum::extract::Query;
use axum::response::Json;
use axum::routing::get;
use axum::Router;
use lambda::services;
use lambda_http::{run, Error};
use serde::Deserialize;
use serde_json::{json, Value};
use tower_http::trace::{
    DefaultMakeSpan,
    DefaultOnFailure,
    DefaultOnRequest,
    DefaultOnResponse,
    TraceLayer,
};
use tower_http::LatencyUnit;
use tracing::{info, Level};

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

    info!("Starting services:");
    let recipe_service = services::recipes().await;
    let app = Router::new()
        .route("/", get(root))
        .route("/ping", get(ping))
        .nest("/recipes", recipe_service)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().include_headers(true))
                .on_request(DefaultOnRequest::new().level(Level::INFO))
                .on_response(
                    DefaultOnResponse::new()
                        .level(Level::INFO)
                        .latency_unit(LatencyUnit::Micros),
                )
                .on_failure(
                    DefaultOnFailure::new()
                        .level(Level::INFO)
                        .latency_unit(LatencyUnit::Micros),
                ),
        );

    run(app).await
}
