import os
import boto3
import mimetypes
import time
from enum import Enum

from typing_extensions import TypedDict
from botocore.config import Config
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

xray_recorder.configure(service="KnowledgeBase")
patch_all()

# ----------------------------------------------------------------------
# Environment Variable Setting
# ----------------------------------------------------------------------
try:
    S3_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
    KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
    MODEL_ARN = os.environ["MODEL_ARN"]
    DATASOURCE_ID = os.environ["DATASOURCE_ID"]
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
    s3_config = Config(retries={"max_attempts": 5, "mode": "standard"}, signature_version="s3v4")
    bedrock_service_client = boto3.client("bedrock", config=config)
    bedrock_runtime_client = boto3.client("bedrock-runtime", config=config)
    bedrock_agent_client = boto3.client("bedrock-agent", config=config)
    bedrock_agent_runtime_client = boto3.client("bedrock-agent-runtime", config=config)
    s3_client = boto3.client("s3", config=s3_config)
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
        operation_type = event["operation"]
        if operation_type == "get_knowledge":
            response = get_knowledge(event)
        elif operation_type == "get_presigned_url":
            response = get_presigned_url(event)
        elif operation_type == "sync_kb_start":
            response = sync_kb_start(event)
        elif operation_type == "sync_kb_describe":
            response = sync_kb_describe(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# File Upload
# ----------------------------------------------------------------------
@xray_recorder.capture("get_presigned_url")
def get_presigned_url(event):
    try:
        # https://kakehashi-dev.hatenablog.com/entry/2022/03/15/101500
        file_name = event["input_prompt"]
        mime_type = event["mime_type"]
        log.debug(file_name)
        log.debug(mime_type)
        log.debug(S3_BUCKET_NAME)
        # ACL設定は不要、API Gatewayで(CORSなどの)ヘッダーを付与しないこと!!
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET_NAME,
                "Key": file_name,
                "ContentType": mime_type,
            },
            HttpMethod="PUT",
            ExpiresIn=900,
        )
        response_body = {"statusCode": 200, "presignedUrl": presigned_url}
        return response_body
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# File Delete
# ----------------------------------------------------------------------


# ----------------------------------------------------------------------
# Sync KnowledgeBase Start
# ----------------------------------------------------------------------
@xray_recorder.capture("sync_kb_start")
def sync_kb_start(event):
    try:
        log.info("KnowledgeBase Synchronisation Start")
        response = bedrock_agent_client.start_ingestion_job(
            dataSourceId=DATASOURCE_ID,
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
        )
        job_id = response["ingestionJob"]["ingestionJobId"]
        response_body = {"statusCode": 200, "text": job_id}
        return response_body
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Sync KnowledgeBase Describe
# ----------------------------------------------------------------------
class Sfn_Status(Enum):
    IN_PROGRESS = "IN_PROGRESS"


@xray_recorder.capture("sync_kb_describe")
def sync_kb_describe(event):
    try:
        log.info("KnowledgeBase Synchronisation Status Ckeck")
        response = bedrock_agent_client.list_ingestion_jobs(
            dataSourceId=DATASOURCE_ID,
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            filters=[
                {
                    "attribute": "STATUS",
                    "operator": "EQ",
                    "values": [
                        "IN_PROGRESS",
                    ],
                },
            ],
            maxResults=1,
            sortBy={
                "attribute": "STARTED_AT",
                "order": "DESCENDING",
            },
        )
        if len(response["ingestionJobSummaries"]) == 0:
            response_body = {"status": "COMPLETE"}
            return response_body
        in_progress_job: Sfn_Status = response["ingestionJobSummaries"][0]["status"]
        response_body = {"status": in_progress_job}
        return response_body
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        response_body = {"status": "FAIL"}
        return response_body


# ----------------------------------------------------------------------
# Search KnowledgeBase
# ----------------------------------------------------------------------
@xray_recorder.capture("get_knowledge")
def get_knowledge(event):
    try:
        user_prompt = event["input_prompt"]
        log.debug(f"user_prompt: {user_prompt}")

        response = bedrock_agent_runtime_client.retrieve_and_generate(
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
        s3_file_name = ""
        try:
            response_s3_uri = response["citations"][0]["retrievedReferences"][0]["location"]["s3Location"]["uri"]
            s3_file_name = response_s3_uri.split("/")[-1]
        except:
            s3_file_name = "Nothing"
            log.info("Not found S3 URI")
        # response_quoted_part= response["citations"][0]["generatedResponsePart"]["textResponsePart"]
        # log.debug(f"s3_file_name: {s3_file_name}")
        response_body = {"statusCode": 200, "text": response_text, "s3FileName": s3_file_name}
        log.info(f"responseBody: {response_body}")
        return response_body

    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
class HTMLRequest(TypedDict):
    input_prompt: str
    operation: str
    mime_type: str


@xray_recorder.capture("lambda_handler")
def lambda_handler(event: HTMLRequest, context):
    try:
        # response = bedrock_service_client.list_foundation_models(
        #     byProvider="anthropic",
        # )
        # log.debug(response)
        log.debug(event)
        response = main(event)
        log.debug(response)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
