import json

def lambda_handler(event, context):

    inputValue = event["key"]
    outputValue = json.dumps({
        "key": inputValue.upper()
    })

    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": outputValue
    }

    return response