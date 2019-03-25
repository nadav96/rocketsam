# DI:

import json


def create_response(body, code=200):
    return {
        "statusCode": code,
        "body": json.dumps(body)
    }


def handler(event, context):
    return create_response({
        "result": 1
    })
