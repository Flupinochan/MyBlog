import os
import json
import random
from datetime import datetime
import base64
import boto3
import langchain
from botocore.config import Config
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from mangum import Mangum

from LoggingClass import LoggingClass
from typing import List

# ----------------------------------------------------------------------
# Environment Variable Setting
# ----------------------------------------------------------------------
try:
    S3_BUCKET = os.environ["BUCKET_NAME"]
except KeyError:
    raise Exception("Environment variable is not defined.")

# ----------------------------------------------------------------------
# Global Variable Setting
# ----------------------------------------------------------------------
try:
    model_client = boto3.client("bedrock")
    bedrock_client = boto3.client("bedrock-runtime")
    s3_client = boto3.client("s3")
    transcribe_client = boto3.client("transcribe")
except Exception:
    raise Exception("Boto3 client error")

# ----------------------------------------------------------------------
# Logger Setting
# ----------------------------------------------------------------------
try:
    logger = LoggingClass("DEBUG")
    log = logger.get_logger()
except Exception:
    raise Exception("Logger Setting failed")


# ----------------------------------------------------------------------
# Main Function
# ----------------------------------------------------------------------
app = FastAPI()


class ConnectionManager:
    def __init_(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def default(self, message: str, websocket: WebSocket):
        await websocket.send_text("hello")


manager = ConnectionManager()


@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.default(data, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


lambda_handler = Mangum(app)
