use super::{DatabaseCredentials, DatabaseCredentialsProvider};

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
    fn next(&mut self) -> &mut Option<Box<dyn DatabaseCredentialsProvider>> { &mut self.next }

    fn provide_database(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.database = std::env::var("DB_NAME").ok();
    }

    fn provide_host(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.host = std::env::var("DB_HOST").ok();
    }

    fn provide_password(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.password = std::env::var("DB_PASSWORD").ok();
    }

    fn provide_port(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.port = std::env::var("DB_PORT").ok();
    }

    fn provide_username(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.username = std::env::var("DB_USERNAME").ok();
    }
}
