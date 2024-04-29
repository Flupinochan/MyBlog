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
    s3_client = boto3.client("s3", config=Config(signature_version="s3v4"))
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
        if "file_name" in event:
            file_name, presigned_url = generate_url(event)
            response = {
                "statusCode": 200,
                "fileName": file_name,
                "downloadURL": presigned_url,
            }
            return response
        elif "transcribe_file_name" in event:
            job_name = transcribe(event)
            response = {"statusCode": 200, "jobName": job_name}
            return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Generate Pre-Signed URL
# ----------------------------------------------------------------------
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
        return event["file_name"], presigned_url
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
        input_file_name = event["transcribe_file_name"]
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
        return job_name
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
def lambda_handler(event, context):
    try:
        print(event)
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
