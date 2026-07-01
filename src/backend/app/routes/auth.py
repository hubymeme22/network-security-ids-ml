import hashlib
import logging
import secrets

from app.models.auth_schema import LoginRequest
from app.models.auth_schema import LoginResponse
from app.models.auth_db_schema import UserTable
from app.config.database import get_db_session
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Response
from fastapi import status

auth_router = APIRouter(prefix="/auth")
logger = logging.getLogger("uvicorn.error")


@auth_router.post("/login")
def login_router(
    login_packet: LoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
) -> LoginResponse:
    """
    Straightforward login authentication route
    """
    try:
        # find matching account
        hashed_password = hashlib.sha256(login_packet.password.encode()).hexdigest()
        logger.info(f"user={login_packet.username} pass={hashed_password}")
        valid_user = db.query(UserTable).where(
            and_(
                UserTable.username == login_packet.username,
                UserTable.hashed_password == hashed_password
            )
        ).first()

        if valid_user:
            random_bytes = secrets.token_bytes(32)
            session_hash = hashlib.sha256(random_bytes).hexdigest()

            # update session for user (to logout of other devices)
            valid_user.session = session_hash
            db.commit()

            return LoginResponse(
                session=session_hash,
                success=True,
            )

        response.status_code = 403
        return LoginResponse(
            session=None,
            success=False,
        )

    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bad Request"
        )


@auth_router.delete("/logout/{session_token}")
def logout_session(
    session_token: str,
    response: Response,
    db: Session = Depends(get_db_session)
):
    db.query(UserTable).where(UserTable.session == session_token).delete()
    response.status_code = 204
