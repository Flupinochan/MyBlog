import os
import json
import boto3
from botocore.config import Config

from LoggingClass import LoggingClass

# ----------------------------------------------------------------------
# Environment Variable Setting
# ----------------------------------------------------------------------
try:
    SES = os.environ["SES"]
except KeyError:
    raise Exception("Environment variable is not defined.")

# ----------------------------------------------------------------------
# Global Variable Setting
# ----------------------------------------------------------------------
try:
    config = Config(
        region_name="ap-northeast-1",
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )
    ses_client = boto3.client("ses", config=config)
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
        response_body = send_mail(event)
        response = {"statusCode": 200}
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Send Mail
# ----------------------------------------------------------------------
def send_mail(event):
    try:
        name = event["name"]
        email = event["email"]
        message = event["message"]
        response = ses_client.send_email(
            Source="flupino@metalmental.net",
            Destination={
                "ToAddresses": [
                    "flupino@metalmental.net",
                ],
            },
            Message={
                "Subject": {
                    "Data": "ブログからお問合せがありました",
                    "Charset": "UTF-8",
                },
                "Body": {
                    "Text": {
                        "Data": f"""
名前 : {name}

メールアドレス : {email}

メッセージ : {message}
""",
                        "Charset": "UTF-8",
                    },
                },
            },
            ReplyToAddresses=[
                "flupino@metalmental.net",
            ],
        )
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise


# ----------------------------------------------------------------------
# Entry Point
# ----------------------------------------------------------------------
def lambda_handler(event: dict, context):
    try:
        log.debug(f"event: {event}")
        response = main(event)
        return response
    except Exception as e:
        log.error(f"エラーが発生しました: {e}")
        raise
