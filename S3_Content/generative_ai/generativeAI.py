import json
import boto3
from botocore.config import Config

region = 'ap-northeast-1'
config = Config(
    region_name=region,
    retries={
        'mode': 'standard',
        'max_attempts': 3
    }
)
client = boto3.client('bedrock-runtime')

model_id = 'anthropic.claude-v2:1'

def lambda_handler(event, context):
    prompt_str = str(event['prompt'])
    format = {
        'prompt': f'\n\nHuman: {prompt_str}\nAssistant:',
        'max_tokens_to_sample': 4000
    }

    response = client.invoke_model(
        body=json.dumps(format),
        contentType='application/json',
        accept='application/json',
        modelId=model_id
    )

    response_body = json.loads(response.get('body').read())
    print(response_body.get('completion'))
    response_json= json.dumps({
        'prompt': response_body.get('completion')
    })
    response_format = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": response_json
    }

    return response_format