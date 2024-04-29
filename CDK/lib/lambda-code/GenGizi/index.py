import os
import json
import random
import time
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
    transcribe_client = boto3.client("transcribe")
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
        output_file_name = transcribe(event)
        giziroku(event, output_file_name)
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Transcribe
# ----------------------------------------------------------------------
def transcribe(event):
    try:
        random_number = str(random.randint(0, 1000))
        current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        input_file_name = event["body"]
        job_name = f"{random_number}_{current_time}"
        output_file_name = f"{job_name}.json"
        extension = input_file_name.split(".")[-1]
        # Execute Transcription Job
        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            LanguageCode="ja-JP",
            MediaFormat=extension,
            Media={"MediaFileUri": f"s3://{S3_BUCKET}/{input_file_name}"},
            OutputBucketName=S3_BUCKET,
            OutputKey=output_file_name,
        )
        # Check Transcription Job Status
        while True:
            response = transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            status = response["TranscriptionJob"]["TranscriptionJobStatus"]
            if status == "COMPLETED":
                log.info(f"Transcribe Status: {status}")
                break
            time.sleep(5)
        # Delete Transcription Job
        transcribe_client.delete_transcription_job(TranscriptionJobName=job_name)
        log.info(f"Delete Transcribe Job Name: {job_name}")
        return output_file_name
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Streaming Response with Bedrock
# ----------------------------------------------------------------------
def giziroku(event, output_file_name):
    try:
        # Get Transcription Data
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=output_file_name)
        transcription_json_data = response["Body"].read().decode("utf-8")
        transcription_dict_data = json.loads(transcription_json_data)
        data = transcription_dict_data["results"]["transcripts"][0]["transcript"]

        connectId = event["requestContext"]["connectionId"]
        domainName = event["requestContext"]["domainName"]
        stageName = event["requestContext"]["stage"]

        # Streaming Response
        websocket_client = boto3.client(
            "apigatewaymanagementapi", endpoint_url=f"https://{domainName}/{stageName}"
        )
        model_id = "anthropic.claude-3-opus-20240229-v1:0"
        system_prompt = "あなたは、文字お越しされた議事録を校正し復元する優秀な議事です"
        user_prompt = {"role": "user", "content": data}
        body = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "system": system_prompt,
                "messages": [user_prompt],
            }
        )
        response = bedrock_client.invoke_model_with_response_stream(
            body=body,
            contentType="application/json",
            accept="application/json",
            modelId=model_id,
        )

        retries = 3
        while retries > 0:
            stream = response.get("body")
            if stream:
                for event in stream:
                    chunk = event.get("chunk")
                    bytes_data = chunk.get("bytes")
                    websocket_client.post_to_connection(
                        Data=bytes_data, ConnectionId=connectId
                    )
            else:
                time.sleep(1)
                retries -= 1

    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
def lambda_handler(event: dict, context):
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
        # Default (Send Message)
        main(event)
        return {"statusCode": 200, "body": "Default Exit"}
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
