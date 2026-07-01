from dotenv import load_dotenv
import os

load_dotenv()

DEFAULT_USERNAME = os.environ.get("DEFAULT_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("DEFAULT_PASSWORD", "mlexperiment")
DATABASE_URL = os.environ.get("SQLALCHEMY_DATABASE_URL", "sqlite:///./ids_database.db")
