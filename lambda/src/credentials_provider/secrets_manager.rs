use std::error::Error;

use aws_config::BehaviorVersion;
use aws_sdk_secretsmanager::Client;
use serde_json::Value;
use tracing::{error, event, instrument, span, Level};

use super::{DatabaseCredentials, DatabaseCredentialsProvider};

#[derive(Debug)]
pub struct SecretsManagerCredentialsProviderError;

#[derive(Debug)]
pub(super) struct SecretsManagerCredentialsProvider {
    next: Option<Box<dyn DatabaseCredentialsProvider>>,
    password: Option<String>,
    username: Option<String>,
}

impl SecretsManagerCredentialsProvider {
    #[instrument(name = "secrets_manager", skip_all)]
    async fn get_secret_json(client: &Client) -> Result<Value, Box<dyn Error>> {
        let secret_id = std::env::var("SECRET_ARN")?;
        let secret_value = client
            .get_secret_value()
            .secret_id(secret_id)
            .send()
            .await?;
        let secret_string = secret_value.secret_string().ok_or("No secret string")?;
        let secret_value = serde_json::from_str(secret_string)?;

        Ok(secret_value)
    }

    #[instrument(name = "secrets_manager", skip_all)]
    pub(super) async fn new(next: impl DatabaseCredentialsProvider + Sized + 'static) -> Self {
        let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
        let client = Client::new(&config);
        let result = Self::get_secret_json(&client).await;
        match result {
            Ok(json) => {
                let password = json["password"].as_str().map(|str| str.to_string());
                let username = json["username"].as_str().map(|str| str.to_string());
                Self {
                    next: super::into_next(next),
                    password,
                    username,
                }
            },

            Err(err) => {
                error!("Could not create secret credentials provider: {}", err);
                Self {
                    next: super::into_next(next),
                    password: None,
                    username: None,
                }
            },
        }
    }
}

impl DatabaseCredentialsProvider for SecretsManagerCredentialsProvider {
    fn next(&self) -> &Option<Box<dyn DatabaseCredentialsProvider>> { &self.next }

    #[instrument(name = "secrets_manager", skip_all)]
    fn provide_password(&self, credentials: &mut DatabaseCredentials) {
        credentials.password = self.password.clone();
        match credentials.password {
            Some(_) => event!(Level::INFO, "Providing password"),
            None => (),
        }
    }

    #[instrument(name = "secrets_manager", skip_all)]
    fn provide_username(&self, credentials: &mut DatabaseCredentials) {
        credentials.username = self.username.clone();
        match credentials.username {
            Some(_) => event!(Level::INFO, "Providing username"),
            None => (),
        }
    }
}
