import os
import sys
import boto3
import langchain
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config

from LoggingClass import LoggingClass

# ----------------------------------------------------------------------
# Logger Setting
# ----------------------------------------------------------------------
logger = LoggingClass("DEBUG")
log = logger.get_logger()

def lambda_handler(event, context):

    print(boto3.__version__)
    print(langchain.__version__)