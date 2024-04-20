import os
import sys
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config

from LoggingClass import LoggingClass

# ----------------------------------------------------------------------
# Logger Setting
# ----------------------------------------------------------------------
logger = LoggingClass("DEBUG")
log = logger.get_logger()

def lambda_handler(event, context):

    log.debug("hello")