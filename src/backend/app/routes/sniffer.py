import logging

from app.models.sniffer_schema import FilterUpdateRequest
from app.middleware.auth_middleware import AuthMetricsRoute
from app.background.sniffer_worker import sniffer_manager
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("uvicorn.error")
sniffer_router = APIRouter(prefix="/sniffer", route_class=AuthMetricsRoute)


@sniffer_router.get("/filter")
def get_filter():
    """
    Retrieves the current BPF filter string being used by the Scapy sniffer.
    """
    try:
        return {"filter": sniffer_manager.get_filter()}
    except Exception as e:
        logger.error(f"Error retrieving filter: {e}")
        raise HTTPException(status_code=500, detail="Internal server error retrieving filter")


@sniffer_router.post("/filter")
def update_filter(payload: FilterUpdateRequest):
    """
    Validates and updates the Scapy BPF filter string.
    """
    try:
        sniffer_manager.set_filter(payload.filter)
        return {
            "status": "success",
            "message": f"Successfully updated and applied filter: '{payload.filter}'"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating filter: {e}")
        raise HTTPException(status_code=500, detail="Internal server error updating filter")
