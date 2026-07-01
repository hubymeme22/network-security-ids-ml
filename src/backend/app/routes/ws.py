from app.background.sniffer_worker import packet_queue
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

websocket_router = APIRouter(prefix="/ws")

@websocket_router.websocket("/live-packet/{session_id}")
async def live_session(websocket: WebSocket, session_id: str):
    """
    Returns the live inbound and outbound packets from the system
    including their inference status (anomaly / normal) and confidence
    """
    await websocket.accept()

    try:
        while True:
            # session checks here...
            features = await packet_queue.get()

            # prediction = model.predict(transform(features))
            # features['is_anomaly'] = int(prediction[0])
            await websocket.send_json(features)

            # Mark the item as processed
            packet_queue.task_done()

    except WebSocketDisconnect:
        print(f"Monitoring client disconnected: {websocket.client}")
    except Exception as e:
        print(f"WebSocket Error: {e}")
