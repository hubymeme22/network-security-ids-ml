from pydantic import BaseModel
from typing_extensions import Optional

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    session: Optional[str]
    success: bool
