# DI:

import json
import os
import time


def create_response(body, code=200):
    return {
        "statusCode": code,
        "body": json.dumps(body)
    }


def handler(event, context):
    try:
        with open("/mnt/efs/{}.txt".format(int(time.time())), "w") as fw:
            fw.write("hello world")
    except Exception as e:
        return create_response({
            "e": e
        })
    return create_response({
        "files": os.listdir("/mnt/efs")
    })
