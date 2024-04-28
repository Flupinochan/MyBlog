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
        test(event)
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Put Image to S3 and Generate Pre-Signed URL
# ----------------------------------------------------------------------
def test(event):
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
# Put Image to S3 and Generate Pre-Signed URL
# ----------------------------------------------------------------------
def pug_image(image):
    try:
        random_number = str(random.randint(0, 1000))
        current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        image_name = f"{random_number}_{current_time}.png"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=image_name,
            Body=image,
        )
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": image_name},
            ExpiresIn=86400,
            HttpMethod="GET",
        )
        return presigned_url
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