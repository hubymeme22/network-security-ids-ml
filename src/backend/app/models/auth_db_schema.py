from sqlalchemy import Column, Integer, String, Boolean
from app.config.database import Base

class UserTable(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    session = Column(String, unique=True, index=True, nullable=True)
