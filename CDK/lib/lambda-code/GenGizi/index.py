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
    ROUTE_KEY = ""
    CONNECT_ID = ""
    DOMAIN_NAME = ""
    STAGE_NAME = ""
except KeyError:
    raise Exception("Environment variable is not defined.")

# ----------------------------------------------------------------------
# Global Variable Setting
# ----------------------------------------------------------------------
try:
    # config = Config(connect_timeout=10, read_timeout=60)
    config = Config(
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )
    bedrock_client = boto3.client("bedrock-runtime", config=config)
    s3_client = boto3.client("s3", config=config)
    transcribe_client = boto3.client("transcribe", config=config)
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
        giziroku(output_file_name)
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
        log.info(f"Transcribe Job Name: {job_name}")
        log.info(f"Transcribe Input File Name: {input_file_name}")
        log.info(f"Transcribe Output File Name: {output_file_name}")
        # Execute Transcription Job
        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            LanguageCode="ja-JP",
            MediaFormat=extension,
            Media={"MediaFileUri": f"s3://{S3_BUCKET}/{input_file_name}"},
            OutputBucketName=S3_BUCKET,
            OutputKey=output_file_name,
            Settings={
                "VocabularyName": "menber",
            },
            ModelSettings={"LanguageModelName": "custom"},
        )
        # Check Transcription Job Status
        while True:
            response = transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            status = response["TranscriptionJob"]["TranscriptionJobStatus"]
            if status == "COMPLETED":
                log.debug(f"Transcribe Status: {status}")
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
def giziroku(output_file_name):
    try:
        # Get Transcription Data
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=output_file_name)
        transcription_json_data = response["Body"].read().decode("utf-8")
        transcription_dict_data = json.loads(transcription_json_data)
        data = transcription_dict_data["results"]["transcripts"][0]["transcript"]

        # Streaming Response
        model_id = "anthropic.claude-3-opus-20240229-v1:0"
        system_prompt = """あなたは、優秀なAWSエンジニアで、文字お越しされた議事録を校正し復元する優秀な議事です。
前置きは不要で、作成した議事録のみ回答してください。
不明確な情報は不要です。嘘も付かないでください。
AWSやITに関係する用語はカタカナではなく英語やアルファベットにしてください。
あー、えー、などのフィラーは除いてください。
明確で専門的な言葉を使用し、見出し、小見出し、箇条書きなどの適切な書式を使用して要約を論理的に整理します。
概要は理解しやすく、会議の内容の包括的かつ簡潔な概要を提供するものにしてください。
要約は不要で、素の情報を出力してください。
曖昧な日本語や英語、漢字やカタカナであれば、出力しないでください
もしくは、可能であれば、正しい日本語や英語に復元してください。
以上の内容をしっかりと理解した上で、出力形式は、マークダウン形式にしてください。
また、出力内容はマークダウンのみにして、不要なDOM要素やHTMLタグは含めないでください。
"""
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

        websocket_client = boto3.client(
            "apigatewaymanagementapi",
            endpoint_url=f"https://{DOMAIN_NAME}/{STAGE_NAME}",
        )
        retries = 5
        while retries > 0:
            stream = response.get("body")
            if stream:
                for event in stream:
                    chunk = event.get("chunk")
                    if chunk:
                        chunk_json = json.loads(chunk.get("bytes").decode())
                        if chunk_json["type"] == "content_block_delta":
                            data = chunk_json["delta"]["text"]
                            # バイト文字列に戻して送信
                            bytes_data = data.encode()
                            websocket_client.post_to_connection(
                                Data=bytes_data, ConnectionId=CONNECT_ID
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
        global ROUTE_KEY, CONNECT_ID, DOMAIN_NAME, STAGE_NAME
        ROUTE_KEY = event["requestContext"]["routeKey"]
        CONNECT_ID = event["requestContext"]["connectionId"]
        DOMAIN_NAME = event["requestContext"]["domainName"]
        STAGE_NAME = event["requestContext"]["stage"]
        connection_info = {
            "Route Key": ROUTE_KEY,
            "Connection ID": CONNECT_ID,
            "Domain Name": DOMAIN_NAME,
            "Stage Name": STAGE_NAME,
        }
        log.info(f"Connection Info: {connection_info}")
        # Connect
        if ROUTE_KEY == "$connect":
            return {"statusCode": 200, "body": "Connected"}
        # Disconnect
        if ROUTE_KEY == "$disconnect":
            return {"statusCode": 200, "body": "Disconnected"}
        # Default
        main(event)
        return {"statusCode": 200, "body": "Default Exit"}
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
