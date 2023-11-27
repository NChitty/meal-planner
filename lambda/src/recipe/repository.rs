use sqlx::{Connection, Row};
use sqlx::postgres::{PgConnection, PgRow};
use uuid::Uuid;
use crate::recipe::Recipe;

pub(super) async fn read(connection: &mut dyn Connection<Database=(), Options=()>, id: Uuid) -> Result<Recipe, Err> {
    sqlx::query_as::<_, Recipe>("SELECT * FROM recipe WHERE id = ?")
        .bind(id)
        .fetch_one(connection)?
}
