# https://pypi.org/project/boto3-stubs/
# python -m pip install 'boto3-stubs[bedrock-runtime]'

import os
import json
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
    raise Exception("Environment variable BUCKET_NAME is not defined.")

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
        response = {"statusCode": 200, "body": presigned_url}
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
def create_image(event):
    try:
        model_id = "stability.stable-diffusion-xl-v1"
        positive_prompt = event["positive_prompt"]
        negative_prompt = event["negative_prompt"]
        log.debug(f"positive_prompt: {positive_prompt}")
        # https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/model-parameters-diffusion-1-0-text-image.html
        body = {
            "text_prompts": [
                {"text": positive_prompt, "weight": 1.0},
                {"text": negative_prompt, "weight": -1.0},
            ],
            "height": 1024,
            "width": 1024,
            "cfg_scale": 10,  # 数値が大きいほどプロンプトに忠実でランダム性がなくなる
            # 'clip_guidance_preset': 'SLOW',
            # 'sampler': string,
            "samples": 1,
            # 'seed': int, # 似た画像を生成したい場合
            "steps": 100,  # 数値が大きいほど重くなるがクオリティが高くなる
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
def pug_image(image):
    try:
        image_name = "test.png"
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
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise