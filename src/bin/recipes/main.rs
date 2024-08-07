use axum::response::Json;
use axum::routing::get;
use axum::Router;
use lambda_http::{run, Error};
use serde_json::{json, Value};
use tower_http::trace::{
    DefaultMakeSpan,
    DefaultOnFailure,
    DefaultOnRequest,
    DefaultOnResponse,
    TraceLayer,
};
use tower_http::LatencyUnit;
use tracing::Level;

mod controller;

async fn ping() -> Json<Value> { Json(json!({ "msg": "Pong" })) }

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    let recipes_controller = controller::recipes().await;
    let app = Router::new()
        .route("/ping", get(ping))
        .nest("/", recipes_controller)
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
