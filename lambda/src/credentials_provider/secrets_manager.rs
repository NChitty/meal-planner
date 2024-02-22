use aws_config::BehaviorVersion;
use aws_sdk_secretsmanager::operation::get_secret_value::GetSecretValueOutput;
use aws_sdk_secretsmanager::Client;
use serde_json::Value;
use tokio::runtime::Handle;

use super::{DatabaseCredentials, DatabaseCredentialsProvider};

pub(super) struct SecretsManagerCredentialsProvider {
    next: Option<Box<dyn DatabaseCredentialsProvider>>,
    client: Client,
}

impl SecretsManagerCredentialsProvider {
    pub(super) fn new(next: impl DatabaseCredentialsProvider + Sized + 'static) -> Self {
        Self {
            next: super::into_next(next),
            client: Client::new(&aws_config::load_from_env().await),
        }
    }
}

impl DatabaseCredentialsProvider for SecretsManagerCredentialsProvider {
    fn next(&mut self) -> &mut Option<Box<dyn DatabaseCredentialsProvider>> { &mut self.next }

    fn provide_password(&mut self, credentials: &mut DatabaseCredentials) {
        let secret_id = std::env::var("SECRET_ID").ok();
        if let None = std::env::var("SECRET_ID").ok() {
            // todo some logging
            credentials.password = None;
            return;
        };

        let secret_id = secret_id.unwrap();
        let secret_value = self.client
            .get_secret_value()
            .secret_id(secret_id)
            .send()
            .await;
        if let Err(error) = secret_value {
            // todo some logging
            credentials.password = None;
            return;
        };

        let secret_string = secret_value.unwrap().secret_string();
        if let None = secret_string {
            // todo some logging
            credentials.password = None;
            return;
        }

        let secret_value = serde_json::from_str(secret_string.unwrap());
        if let Ok(secret_json) = secret_value {
            // todo some logging
            credentials.password = Some(secret_json["password"]);
            return;
        }

        credentials.password = None;
        return;
    }

    fn provide_username(&mut self, credentials: &mut DatabaseCredentials) {
        let secret_id = std::env::var("SECRET_ID").ok();
        if let None = std::env::var("SECRET_ID").ok() {
            // todo some logging
            credentials.username = None;
            return;
        };

        let secret_id = secret_id.unwrap();
        let secret_value = self
            .client
            .get_secret_value()
            .secret_id(secret_id)
            .send()
            .await;
        if let Err(error) = secret_value {
            // todo some logging
            credentials.username = None;
            return;
        };

        let secret_string = secret_value.unwrap().secret_string();
        if let None = secret_string {
            // todo some logging
            credentials.username = None;
            return;
        }

        let secret_value = serde_json::from_str(secret_string.unwrap());
        if let Ok(secret_json) = secret_value {
            // todo some logging
            credentials.username = Some(secret_json["password"]);
            return;
        }

        credentials.username = None;
        return;
    }
}
