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
        image = create_image(event)
        presigned_url = pug_image(image)
        response = {
            "statusCode": 200,
            "downloadURL": presigned_url,
            "image": base64.b64encode(image).decode("utf-8"),
        }
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Translate Japanese into English.
# ----------------------------------------------------------------------


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
    # log.debug('='*20 +'Library Version' + '='*20)
    # log.debug(f'boto3: {boto3.__version__}')
    # log.debug(f'langchain: {langchain.__version__}')
    # log.debug(model_client.list_foundation_models())
    try:
        print(event)
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
