from fastapi import APIRouter
from app.utils.devices import list_devices

devices_router = APIRouter()

@devices_router.get("/network-cards")
def get_system_devices():
    """
    Retrieves this system's network card interfaces
    """
    return list_devices()

