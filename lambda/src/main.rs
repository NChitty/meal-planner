use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};

mod recipe;

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let path = event.raw_http_path();
    let who = event
        .query_string_parameters_ref()
        .and_then(|params| params.first("name"))
        .unwrap_or("world");

    println!("Path: {path}");
    if path.contains("/ping") {
        let message = "Pong";
        let resp = Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(message.into())
            .map_err(Box::new)?;
        return Ok(resp);
    }

    let message = format!("Hello {who}");

    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(message.into())
        .map_err(Box::new)?;

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
