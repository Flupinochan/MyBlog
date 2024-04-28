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
def main():
    try:
        file_name, presigned_url = generate_url()
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
def generate_url():
    try:
        random_number = str(random.randint(0, 1000))
        current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        file_name = f"{current_time}_{random_number}"
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": S3_BUCKET, "Key": file_name},
            ExpiresIn=900,
            HttpMethod="PUT",
        )
        return file_name, presigned_url
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
def lambda_handler(event, context):
    try:
        response = main()
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
