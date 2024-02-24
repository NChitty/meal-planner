use std::env::VarError;
use std::error::Error;
use std::fmt::Display;

use aws_config::BehaviorVersion;
use aws_sdk_secretsmanager::Client;
use serde_json::Value;

use super::{DatabaseCredentials, DatabaseCredentialsProvider};

#[derive(Debug)]
pub struct SecretsManagerCredentialsProviderError;

impl Display for SecretsManagerCredentialsProviderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { write!(f, "{}", self) }
}

impl Error for SecretsManagerCredentialsProviderError {
    fn source(&self) -> Option<&(dyn Error + 'static)> { None }

    fn cause(&self) -> Option<&dyn Error> { self.source() }
}

impl From<VarError> for SecretsManagerCredentialsProviderError {
    fn from(value: VarError) -> Self { Self {} }
}

impl From<&str> for SecretsManagerCredentialsProviderError {
    fn from(value: &str) -> Self { Self {} }
}

impl From<serde_json::Error> for SecretsManagerCredentialsProviderError {
    fn from(value: serde_json::Error) -> Self { Self {} }
}

pub(super) struct SecretsManagerCredentialsProvider {
    next: Option<Box<dyn DatabaseCredentialsProvider>>,
    password: Option<String>,
    username: Option<String>,
}

impl SecretsManagerCredentialsProvider {
    async fn get_secret_json(
        client: &Client,
    ) -> Result<Value, SecretsManagerCredentialsProviderError> {
        let secret_id = std::env::var("SECRET_ID")?;
        let secret_value = client
            .get_secret_value()
            .secret_id(secret_id)
            .send()
            .await
            .map_err(|_| SecretsManagerCredentialsProviderError {})?;
        let secret_string = secret_value.secret_string().ok_or("No secret string")?;
        let secret_value = serde_json::from_str(secret_string)?;

        Ok(secret_value)
    }

    pub(super) async fn new(next: impl DatabaseCredentialsProvider + Sized + 'static) -> Self {
        let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
        let client = Client::new(&config);
        let result = Self::get_secret_json(&client).await;
        if let Ok(json) = result {
            return Self {
                next: super::into_next(next),
                password: Some(json["password"].to_string()),
                username: Some(json["username"].to_string()),
            };
        }
        Self {
            next: super::into_next(next),
            password: None,
            username: None,
        }
    }
}

impl DatabaseCredentialsProvider for SecretsManagerCredentialsProvider {
    fn next(&self) -> &Option<Box<dyn DatabaseCredentialsProvider>> { &self.next }

    fn provide_password(&self, credentials: &mut DatabaseCredentials) {
        credentials.password = self.password.clone()
    }

    fn provide_username(&self, credentials: &mut DatabaseCredentials) {
        credentials.username = self.username.clone()
    }
}
