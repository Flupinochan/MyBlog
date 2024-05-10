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

xray_recorder.configure(service="Gen GenText")
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
    config = Config(
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )
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
        response_body = generate_text(event)
        response = {"statusCode": 200, "text": response_body}
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Generate Text
# ----------------------------------------------------------------------
@xray_recorder.capture("generate_text")
def generate_text(event):
    try:
        preamble = """
## Task & Context
You help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user's needs as best you can, which will be wide-ranging.

## Style Guide
Unless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.
Unnecessary ambiguity is unwelcome. Please refrain from falsehoods. Utilize clear and professional language, employing appropriate formatting such as headings, subheadings, and bullet points. 

## Output Format
The output format should be in Markdown only and omitting any unnecessary DOM elements or HTML tags.
"""
        positive_prompt = event["positive_prompt"]
        model_id = "cohere.command-r-plus-v1:0"
        data = json.dumps(
            {
                "message": positive_prompt,
                "preamble": preamble,
                "temperature": 0.9,
                "p": 0.75,
                "k": 0,
                "max_tokens": 512,
            }
        )
        response = bedrock_client.invoke_model(
            body=data,
            contentType="application/json",
            accept="application/json",
            modelId=model_id,
            trace="DISABLED",
        )
        response_body = response["body"].read()
        response_body = json.loads(response_body)
        response_body = response_body["chat_history"][-1]["message"]
        log.debug(f"response_body is: {response_body}")
        return response_body
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
@xray_recorder.capture("lambda_handler")
def lambda_handler(event: dict, context):
    try:
        log.debug(f"event: {event}")
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
