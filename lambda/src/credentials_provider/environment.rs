use tracing::{event, instrument, span, Level};

use super::{DatabaseCredentials, DatabaseCredentialsProvider};

#[derive(Debug)]
pub(super) struct EnvironmentCredentialsProvider {
    next: Option<Box<dyn DatabaseCredentialsProvider>>,
}

impl EnvironmentCredentialsProvider {
    pub(super) fn new(next: impl DatabaseCredentialsProvider + Sized + 'static) -> Self {
        Self {
            next: super::into_next(next),
        }
    }
}

impl DatabaseCredentialsProvider for EnvironmentCredentialsProvider {
    fn next(&self) -> &Option<Box<dyn DatabaseCredentialsProvider>> { &self.next }

    #[instrument(name = "environment", skip_all)]
    fn provide_database(&self, credentials: &mut DatabaseCredentials) {
        credentials.database = std::env::var("DB_NAME").ok();
        match credentials.database {
            Some(_) => event!(Level::INFO, "Providing database name"),
            None => (),
        }
    }

    #[instrument(name = "environment", skip_all)]
    fn provide_host(&self, credentials: &mut DatabaseCredentials) {
        credentials.host = std::env::var("DB_HOST").ok();
        match credentials.host { 
            Some(_) => event!(Level::INFO, "Providing host"),
            None => ()
        }
    }

    #[instrument(name = "environment", skip_all)]
    fn provide_password(&self, credentials: &mut DatabaseCredentials) {
        credentials.password = std::env::var("DB_PASSWORD").ok();
        match credentials.password { 
            Some(_) => event!(Level::INFO, "Providing password"),
            None => ()
        }
    }

    #[instrument(name = "environment", skip_all)]
    fn provide_port(&self, credentials: &mut DatabaseCredentials) {
        credentials.port = std::env::var("DB_PORT").ok();
        match credentials.port { 
            Some(_) => event!(Level::INFO, "Providing port"),
            None => ()
        }
    }

    #[instrument(name = "environment", skip_all)]
    fn provide_username(&self, credentials: &mut DatabaseCredentials) {
        credentials.username = std::env::var("DB_USERNAME").ok();

        match credentials.username { 
            Some(_) => event!(Level::INFO, "Providing username"),
            None => ()
        }
    }
}
