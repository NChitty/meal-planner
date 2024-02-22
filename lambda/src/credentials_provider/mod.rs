use self::default::DefaultsCredentialsProvider;
use self::environment::EnvironmentCredentialsProvider;
use self::secrets_manager::SecretsManagerCredentialsProvider;

mod default;
mod environment;
mod secrets_manager;

#[derive(Default)]
pub struct DatabaseCredentials {
    database: Option<String>,
    host: Option<String>,
    password: Option<String>,
    port: Option<String>,
    username: Option<String>,
}

impl DatabaseCredentials {
    pub fn get_connection_string(&self) -> String {
        format!(
            "postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        )
    }
}

pub trait DatabaseCredentialsProvider {
    fn execute(&mut self, credentials: &mut DatabaseCredentials) {
        if credentials.database.is_none() {
            self.provide_database(credentials);
        }

        if credentials.host.is_none() {
            self.provide_host(credentials);
        }

        if credentials.password.is_none() {
            self.provide_password(credentials);
        }

        if credentials.port.is_none() {
            self.provide_port(credentials);
        }

        if credentials.username.is_none() {
            self.provide_username(credentials);
        }

        if let Some(next) = &mut self.next() {
            next.execute(credentials);
        }
    }

    fn provide_database(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.database = None;
    }

    fn provide_host(&mut self, credentials: &mut DatabaseCredentials) { credentials.host = None; }

    fn provide_password(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.port = None;
    }

    fn provide_port(&mut self, credentials: &mut DatabaseCredentials) { credentials.port = None; }

    fn provide_username(&mut self, credentials: &mut DatabaseCredentials) {
        credentials.username = None;
    }

    fn next(&mut self) -> &mut Option<Box<dyn DatabaseCredentialsProvider>>;
}

pub(self) fn into_next(
    credentials_provider: impl DatabaseCredentialsProvider + Sized + 'static,
) -> Option<Box<dyn DatabaseCredentialsProvider>> {
    Some(Box::new(credentials_provider))
}

pub fn get_credentials() -> DatabaseCredentials {
    let defaults_provider = DefaultsCredentialsProvider::default();
    let environment_provider = EnvironmentCredentialsProvider::new(defaults_provider);
    let mut secrets_manager_provider = SecretsManagerCredentialsProvider::new(environment_provider);

    let mut credentials = DatabaseCredentials::default();

    secrets_manager_provider.execute(&mut credentials);

    credentials
}
