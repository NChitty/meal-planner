use super::{DatabaseCredentials, DatabaseCredentialsProvider};

#[derive(Default)]
pub(super) struct DefaultsCredentialsProvider {
    next: Option<Box<dyn DatabaseCredentialsProvider>>,
}

impl DatabaseCredentialsProvider for DefaultsCredentialsProvider {
    fn next(&mut self) -> &mut Option<Box<dyn DatabaseCredentialsProvider>> { &mut self.next }

    fn provide_database(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.database = Some("meal-planner".to_string());
    }

    fn provide_host(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.host = Some("db".to_string());
    }

    fn provide_password(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.password = Some("password1234".to_string());
    }

    fn provide_port(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.port = Some("5432".to_string());
    }

    fn provide_username(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.username = Some("postgres".to_string());
    }
}
