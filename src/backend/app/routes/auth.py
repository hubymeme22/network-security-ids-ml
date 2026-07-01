import hashlib
import secrets

from app.models.auth_schema import LoginRequest
from app.models.auth_schema import LoginResponse
from app.config.app_config import DEFAULT_USERNAME
from app.config.app_config import DEFAULT_PASSWORD
from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import status


auth_router = APIRouter(prefix="/auth")
ACTIVE_SESSIONS: set[str] = set()


@auth_router.post("/login")
def login_router(login_packet: LoginRequest) -> LoginResponse:
    global current_session

    is_valid_user = secrets.compare_digest(login_packet.username, DEFAULT_USERNAME)
    is_valid_pass = secrets.compare_digest(login_packet.password, DEFAULT_PASSWORD)

    if is_valid_user and is_valid_pass:
        random_bytes = secrets.token_bytes(32)
        session_hash = hashlib.sha256(random_bytes).hexdigest()

        ACTIVE_SESSIONS.add(session_hash)
        return LoginResponse(
            session=session_hash,
            success=True,
        )

    # FastAPI standard for handling authentication rejections cleanly
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid credentials layout."
    )


@auth_router.delete("/logout")
def logout_session(session_token) -> LoginResponse:
    if session_token in ACTIVE_SESSIONS:
            ACTIVE_SESSIONS.remove(session_token)
            return { "message": "Successfully destroyed session" }
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Session token not found or already expired."
    )
