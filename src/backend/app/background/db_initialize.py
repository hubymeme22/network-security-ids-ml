import logging
import sqlalchemy as sa

from app.models.auth_db_schema import UserTable
from app.config.app_config import DEFAULT_PASSWORD
from app.config.app_config import DEFAULT_USERNAME
from app.config.database import SessionLocal
from app.config.database import engine
from sqlalchemy.orm import Session


logger = logging.getLogger("uvicorn.error")

def is_table_empty(db: Session, db_schema):
    count_statement = sa.select(sa.func.count()).select_from(UserTable)
    user_rows_count = db.execute(count_statement).scalar()
    return user_rows_count == 0


def initalize_database_contents():
    """
    function specifically made for adding contents to be initialized
    in the database (first run)
    """
    inspector = sa.inspect(engine)

    # checks if the user is already created
    if inspector.has_table("users"):
        db = SessionLocal()
        try:
            if is_table_empty(db, UserTable):
                db.add(UserTable(
                    username=DEFAULT_USERNAME,
                    hashed_password=DEFAULT_PASSWORD,  
                    is_active=True
                ))

            db.commit()
            db.close()
            logger.info("Successfully added default users from the database")
        except Exception as e:
                db.rollback()
                logger.error(f"IDS Engine: Failed to seed default configuration: {e}")
        finally:
            db.close()

