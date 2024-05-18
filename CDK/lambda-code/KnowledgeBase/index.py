import os
import boto3

from typing_extensions import TypedDict
from botocore.config import Config
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

xray_recorder.configure(service="Get KnowledgeBase")
patch_all()

# ----------------------------------------------------------------------
# Environment Variable Setting
# ----------------------------------------------------------------------
try:
    # S3_BUCKET = os.environ["BUCKET_NAME"]
    KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
    MODEL_ARN = os.environ["MODEL_ARN"]
    # "arn:aws:bedrock:us-west-2::foundation-model/" + MODEL_ID
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
    bedrock_service_client = boto3.client("bedrock", config=config)
    bedrock_client = boto3.client("bedrock-runtime", config=config)
    bedrock_agent_client = boto3.client("bedrock-agent-runtime", config=config)
except Exception as error:
    raise Exception("Boto3 client error" + str(error))

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
        response = execute_bedrock(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# File Upload
# ----------------------------------------------------------------------

# ----------------------------------------------------------------------
# Sync OpenSearch
# ----------------------------------------------------------------------


# ----------------------------------------------------------------------
# Execute Bedrock
# ----------------------------------------------------------------------
@xray_recorder.capture("execute_bedrock")
def execute_bedrock(event):
    try:
        user_prompt = event["input_prompt"]
        log.debug(f"user_prompt: {user_prompt}")

        response = bedrock_agent_client.retrieve_and_generate(
            # sessionId='string', # for creating chatbot
            input={
                "text": user_prompt,
            },
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                    "modelArn": MODEL_ARN,
                },
            },
        )
        response_text = response["output"]["text"]
        response_s3_uri = response["citations"][0]["retrievedReferences"][0]["location"]["s3Location"]["uri"]
        s3_file_name = response_s3_uri.split("/")[-1]
        # response_quoted_part= response["citations"][0]["generatedResponsePart"]["textResponsePart"]
        # log.debug(f"s3_file_name: {s3_file_name}")
        response_body = {"statusCode": 200, "text": response_text, "s3FileName": s3_file_name}
        return response_body

    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
class HTMLRequest(TypedDict):
    input_prompt: str


@xray_recorder.capture("lambda_handler")
def lambda_handler(event: HTMLRequest, context):
    try:
        # response = bedrock_service_client.list_foundation_models(
        #     byProvider="anthropic",
        # )
        # log.debug(response)
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
