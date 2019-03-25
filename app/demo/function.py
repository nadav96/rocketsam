# DI:demo/hello


import json
from common.hello import hello
from common.fire import fire


def create_response(body, code=200):
    return {
        "statusCode": code,
        "body": json.dumps(body)
    }


def handler(event, context):
    hello()
    fire()
    return create_response({
        "result": 1
    })
