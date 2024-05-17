import os
import boto3

from botocore.config import Config

# from aws_xray_sdk.core import xray_recorder
# from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

# xray_recorder.configure(service="Gen IMG")
# patch_all()

# ----------------------------------------------------------------------
# Environment Variable Setting
# ----------------------------------------------------------------------
try:
    # S3_BUCKET = os.environ["BUCKET_NAME"]
    # KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
    # MODEL_ARN = os.environ["MODEL_ARN"]
    pass
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
# @xray_recorder.capture("main")
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
# @xray_recorder.capture("execute_bedrock")
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
                    "knowledgeBaseId": "U8BBQGOUG7",
                    "modelArn": "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                    # "arn:aws:bedrock:us-west-2::foundation-model/" + MODEL_ID
                },
            },
        )
        response_text = response["output"]["text"]
        response_s3_location = response["citations"][0]["retrievedReferences"][0]["location"]["s3Location"]["uri"]
        # response_quoted_part= response["citations"][0]["generatedResponsePart"]["textResponsePart"]
        # log.debug(f"response_s3_location: {response_s3_location}")
        response_body = {"statusCode": 200, "text": response_text, "location": response_s3_location}
        return response_body

    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
# @xray_recorder.capture("lambda_handler")
def lambda_handler(event, context):
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
