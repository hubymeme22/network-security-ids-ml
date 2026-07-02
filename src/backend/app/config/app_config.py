from dotenv import load_dotenv
import os

load_dotenv()

DEFAULT_USERNAME = os.environ.get("DEFAULT_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("DEFAULT_PASSWORD", "mlexperiment")
DATABASE_URL = os.environ.get("SQLALCHEMY_DATABASE_URL", "sqlite:///./ids_database.db")

# index configurations
PROTOCOL_MAP = {
    "tcp": 0,
    "udp": 1,
    "icmp": 2,
    "other": 3
}

SERVICE_MAP = {
    "private": 0,
    "ftp": 1,
    "ssh": 2,
    "http": 3,
    "telnet": 4,
    "smtp": 5,
    "domain": 6,
    "ecr_i": 7,
    "icmp": 8,
    "other": 9
}

FLAG_MAP = {
    "SF": 0,
    "S0": 1,
    "REJ": 2,
    "other": 3
}
