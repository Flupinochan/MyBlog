# https://pypi.org/project/boto3-stubs/
# python -m pip install 'boto3-stubs[bedrock-runtime]'

import os
import json
import random
from datetime import datetime
import base64
import boto3
import langchain
from botocore.config import Config
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

xray_recorder.configure(service="Gen IMG")
patch_all()

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
    config = Config(retries={"max_attempts": 5, "mode": "standard"})
    model_client = boto3.client("bedrock", config=config)
    bedrock_client = boto3.client("bedrock-runtime", config=config)
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
@xray_recorder.capture("main")
def main(event):
    try:
        image = create_image(event)
        presigned_url = put_image(image)
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
# Create Image
# ----------------------------------------------------------------------
@xray_recorder.capture("create_image")
def create_image(event):
    try:
        model_id = "stability.stable-diffusion-xl-v1"
        positive_prompt = event["positive_prompt"]
        negative_prompt = event["negative_prompt"]
        size = event["size"]
        steps = event["steps"]
        cfg_scale = event["cfg_scale"]
        log.debug(f"positive_prompt: {positive_prompt}")
        # https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/model-parameters-diffusion-1-0-text-image.html
        body = {
            "text_prompts": [
                {"text": positive_prompt, "weight": 1.0},
                {"text": negative_prompt, "weight": -1.0},
            ],
            "height": size,
            "width": size,
            "cfg_scale": cfg_scale,  # 数値が大きいほどプロンプトに忠実でランダム性がなくなる
            # 'clip_guidance_preset': 'SLOW',
            # 'sampler': string,
            "samples": 1,
            # 'seed': int, # 似た画像を生成したい場合
            "steps": steps,  # 数値が大きいほど重くなるがクオリティが高くなる
            # 'style_preset': 'anime',
        }
        response = bedrock_client.invoke_model(
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
            modelId=model_id,
        )
        response_byte = json.loads(response["body"].read())
        response_base64 = response_byte["artifacts"][0]["base64"]
        response_image = base64.b64decode(response_base64)
        return response_image
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Put Image to S3 and Generate Pre-Signed URL
# ----------------------------------------------------------------------
@xray_recorder.capture("put_image")
def put_image(image):
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
@xray_recorder.capture("lambda_handler")
def lambda_handler(event: dict, context):
    # log.debug('='*20 +'Library Version' + '='*20)
    # log.debug(f'boto3: {boto3.__version__}')
    # log.debug(f'langchain: {langchain.__version__}')
    # log.debug(model_client.list_foundation_models())
    try:
        log.debug(f"event: {event}")
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise