import os
import json
import random
from datetime import datetime
import base64
import boto3
import langchain
from botocore.config import Config

# from aws_xray_sdk.core import xray_recorder
# from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

# xray_recorder.configure(service="Gen GiziUpload")
# patch_all()

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
    config = Config(retries={"max_attempts": 5, "mode": "standard"}, signature_version="s3v4")
    s3_client = boto3.client("s3", config=config)
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
# @xray_recorder.capture("main")
def main(event):
    try:
        file_name, presigned_url = generate_url(event)
        response = {
            "statusCode": 200,
            "fileName": file_name,
            "downloadURL": presigned_url,
        }
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Generate Pre-Signed URL
# ----------------------------------------------------------------------
# @xray_recorder.capture("generate_url")
def generate_url(event):
    try:
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": event["file_name"],
            },
            ExpiresIn=900,
        )
        log.info(f"Pre-Signed URL: {presigned_url}")
        log.info(f"File Name: {event['file_name']}")
        return event["file_name"], presigned_url
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
# @xray_recorder.capture("lambda_handler")
def lambda_handler(event, context):
    try:
        log.debug(f"Event: {event}")
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
