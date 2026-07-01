import asyncio
import logging
import os
import threading
import uvicorn

from app.background.sniffer_worker import scapy_sniff_worker
from app.background.db_initialize import initalize_database_contents
from app.config.database import Base, engine
from app.routes.auth import auth_router
from app.routes.system import system_router

from contextlib import asynccontextmanager
from fastapi import FastAPI

logger = logging.getLogger("uvicorn.error")

########################
#  application events  #
########################
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()

    # database initialization
    logger.info("Initializing database connection...")
    Base.metadata.create_all(bind=engine)

    # intialization of values
    initalize_database_contents()

    # scapy thread for packet saving
    worker_thread = threading.Thread(target=scapy_sniff_worker, args=(loop,), daemon=True)
    worker_thread.start()

    logger.info("IDS Engine: Scapy worker thread successfully spawned.")
    yield

    # after shutdown process
    logger.warning("IDS Engine: Cleaning up and shutting down gracefully...")


# application with applied lifespan for startup
application = FastAPI(title="Real-Time ML-IDS API & Streaming Engine", lifespan=lifespan)

##############################
#  main application routers  #
##############################
application.include_router(system_router)
application.include_router(auth_router)

if __name__ == "__main__":
    if os.getuid() != 0:
        print("[!] This backend must be executed as root!")
        exit(1)

    uvicorn.run(application, port=8080, host="0.0.0.0")
