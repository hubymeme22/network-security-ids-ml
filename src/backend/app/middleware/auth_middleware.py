import logging
import sqlalchemy as sa

from app.models.auth_db_schema import UserTable
from app.config.database import SessionLocal
from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute

logger = logging.getLogger("uvicorn.error")

class AuthMetricsRoute(APIRoute):
    """
    A modular route-specific middleware class.
    Only intercepts traffic bound for routes using this class.
    """
    def get_route_handler(self) -> Callable:
        original_handler = super().get_route_handler()

        async def custom_handler(request: Request) -> Response:
            auth_bearer = request.headers.get("authorization")
            if auth_bearer is None:
                return Response(
                    content="Authorization header needed",
                    status_code=403,
                )

            db = SessionLocal()
            try:
                bearer_token = auth_bearer.replace("Bearer ", "")
                matched_user = sa.select(sa.func.count()).select_from(UserTable).where(
                    UserTable.session == bearer_token
                )

                session_match = db.execute(matched_user).scalar()
                if session_match > 0:
                    response: Response = await original_handler(request)
                    return response

                return Response(
                    content="Invalid token",
                    status_code=403,
                )

            except Exception as e:
                logger.error(e)
            finally:
                db.close()

        return custom_handler
