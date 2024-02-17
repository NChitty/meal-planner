use std::future::Future;

use sqlx::database;
use uuid::Uuid;

pub mod recipe;
pub mod services;

pub trait Repository<T>: Send + Sync {
    fn find_by_id(&self, id: Uuid) -> impl Future<Output = Option<T>>;
}

pub trait CredentialsProvider {
    fn get_database(&self) -> Option<String>;
    fn get_host(&self) -> Option<String>;
    fn get_password(&self) -> Option<String>;
    fn get_port(&self) -> Option<String>;
    fn get_username(&self) -> Option<String>;
}

struct EnvironmentCredentialsProvider {
    database: Option<String>,
    host: Option<String>,
    password: Option<String>,
    port: Option<String>,
    username: Option<String>,
}

impl Default for EnvironmentCredentialsProvider {
    fn default() -> Self {
        Self {
            database: std::env::var("DB_NAME").ok(),
            host: std::env::var("DB_HOST").ok(),
            password: std::env::var("DB_PASSWORD").ok(),
            port: std::env::var("DB_PORT").ok(),
            username: std::env::var("DB_USERNAME").ok(),
        }
    }
}

impl CredentialsProvider for EnvironmentCredentialsProvider {
    fn get_database(&self) -> Option<String> { self.database.clone() }

    fn get_host(&self) -> Option<String> { self.host.clone() }

    fn get_password(&self) -> Option<String> { self.password.clone() }

    fn get_port(&self) -> Option<String> { self.port.clone() }

    fn get_username(&self) -> Option<String> { self.username.clone() }
}
