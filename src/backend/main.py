from app.routes.devices import devices_router
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

import uvicorn

application = FastAPI()

##############################
#  main application routers  #
##############################
application.add_route("/devices", devices_router)

######################
# Websocket routers  #
######################
@application.websocket("/live-inference/{session}")
async def websocket_process(websocket: WebSocket, session: str):
    """
    Returns the live inference being received by the system
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")

    except WebSocketDisconnect:
        print("Client disconnected cleanly.")


if __name__ == "__main__":
    uvicorn.run(application, port=8080, host="0.0.0.0")
