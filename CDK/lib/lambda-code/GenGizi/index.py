import os
import json
import random
from datetime import datetime
import base64
import boto3
import langchain
from botocore.config import Config

from LoggingClass import LoggingClass

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
def main(event):
    try:
        transcribe(event)
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Transcribe
# ----------------------------------------------------------------------
def transcribe(event):
    try:
        random_number = str(random.randint(0, 1000))
        current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        file_name = event["body"]
        job_name = f"{file_name}_{random_number}_{current_time}"
        extension = file_name.split(".")[-1]
        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            LanguageCode="ja-JP",
            MediaFormat=extension,
            Media={"MediaFileUri": f"s3://{S3_BUCKET}/{file_name}"},
            OutputBucketName=S3_BUCKET,
            OutputKey=f"{job_name}.json",
        )
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Streaming Response
# ----------------------------------------------------------------------
def response(event):
    try:
        routeKey = event["requestContext"]["routeKey"]
        connectId = event["requestContext"]["connectionId"]
        domainName = event["requestContext"]["domainName"]
        stageName = event["requestContext"]["stage"]
        connectionInfo = {
            "Route Key": routeKey,
            "Connection ID": connectId,
            "Domain Name": domainName,
            "Stage Name": stageName,
        }
        log.info(f"Connection Info: {connectionInfo}")

        # Connect
        if routeKey == "$connect":
            return {"statusCode": 200, "body": "Connected"}
        # Disconnect
        if routeKey == "$disconnect":
            return {"statusCode": 200, "body": "Disconnected"}

        # Streaming Response
        # postData = json.loads(event["body"])["data"]
        # print(postData)
        websocket_client = boto3.client(
            "apigatewaymanagementapi", endpoint_url=f"https://{domainName}/{stageName}"
        )

        messages = ["おはよう", "こんにちは", "こんばんは"]
        byte_arrays = []
        for message in messages:
            byte_array = message.encode("utf-8")
            byte_arrays.append(byte_array)

        for chunk in byte_arrays:
            websocket_client.post_to_connection(Data=chunk, ConnectionId=connectId)

    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
def lambda_handler(event: dict, context):
    try:
        print(event)
        main(event)
        return {"statusCode": 200, "body": "Completed"}
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
