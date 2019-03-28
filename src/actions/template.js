'use strict';

const fs = require('fs-extra')
const { readdirSync, statSync } = require('fs-extra')
const { join } = require('path')
const yaml = require('js-yaml')

const appDir = `${process.cwd()}/app`
const buildDir = `${process.cwd()}/.build`
const skeletonTemplateFile = `${buildDir}/template.yaml`

module.exports = {
  createTemplate: async function() {
    console.log("hello template");
    createTemplate()
  }
};

async function createTemplate() {
  await fs.mkdirSync(`${buildDir}`, { recursive: true })
  await fs.copyFileSync(`${appDir}/template-skeleton.yaml`, skeletonTemplateFile)

  const functions = await getFunctions()
  for (var i = 0; i < functions.length; i++) {
    await appendFunctionTemplate(functions[i])
  }
}

async function getFunctions() {
  const dirsFunction = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory() && f != "common")
  return await dirsFunction(appDir)
}

async function appendFunctionTemplate(functionName) {
  const templateFile = `${appDir}/${functionName}/template.yaml`
  try {
    var skeletonDoc = yaml.safeLoad(fs.readFileSync(skeletonTemplateFile, 'utf8'));
    var functionDoc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'))

    const functionResourceName = functionDoc["Name"]
    const functionTimeout = functionDoc["timeout"]
    skeletonDoc["Resources"][functionResourceName] = {
      Type: "AWS::Serverless::Function",
      Properties: {
        CodeUri: `./${functionName}.zip`,
        Handler: "function.handler",
        Runtime: "python3.6",
        Timeout: functionTimeout ? functionTimeout : 10,
        Events: {}
      }
    }

    if (functionDoc["SammyApiEvent"] != undefined) {
      console.log("api event available")
      addApiEventToFunction(functionDoc, skeletonDoc)
    }
    if (functionDoc["SammyBucketEvent"] != undefined) {
      console.log("Bucket event available")
      addBucketEventToFunction(functionDoc, skeletonDoc)
    }

    fs.writeFileSync(skeletonTemplateFile, yaml.safeDump(skeletonDoc))
  }
  catch (e) {
    console.log(e);
  }
}

function addApiEventToFunction(functionDoc, skeletonDoc) {
  const functionResourceName = functionDoc["Name"]
  const apiEvent = functionDoc["SammyApiEvent"]
  const isAuthenticated = apiEvent["isAuthenticated"]
  const excludeSecurity = apiEvent["excludeSecurity"]
  const path = apiEvent["path"]
  const method = apiEvent["method"]

  const functionARN = "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${"+
    functionResourceName + ".Arn}/invocations"

  var endpoint = {}
  endpoint[method] = {
    responses: {},
    security: [
      {
        auth_tokenorizer: []
      }
    ],
    "x-amazon-apigateway-integration": {
      httpMethod: "post",
      type: "aws_proxy",
      uri: {
        "Fn::Sub": functionARN
      }
    }
  }

  skeletonDoc["Resources"]["ApiGateway"]
    ["Properties"]["DefinitionBody"]["paths"][path] = endpoint

  // Now add to the actual function resource
  skeletonDoc["Resources"][functionResourceName]["Properties"]
    ["Events"]["ApiEvent"] = {
      Properties: {
        Method: method,
        Path: path,
        RestApiId: {
          Ref: "ApiGateway"
        }
      },
      Type: "Api"
  }

  return skeletonDoc
}

function addBucketEventToFunction(functionDoc, skeletonDoc) {
  const functionResourceName = functionDoc["Name"]
  const bucketSammyEvent = functionDoc["SammyBucketEvent"]
  const bucketName = bucketSammyEvent["bucketName"]
  const bucketEvent = bucketSammyEvent["bucketEvent"]
  const rules = bucketSammyEvent["Rules"]

  skeletonDoc["Resources"][functionResourceName]["Properties"]
    ["Events"]["BucketEvent"] = {
    Properties: {
      Bucket: {
        Ref: bucketName
      },
      Events: bucketEvent,
      Filter: {
        S3Key: {
          Rules: rules
        }
      }
    }
  }

  // Add bucket access policy
  skeletonDoc["Resources"][functionResourceName]["Properties"]["Policies"] = [
    {
      Statement: [
        {
          Action: ["s3:*"],
          Effect: "Allow",
          Resource: {
            "Fn::Sub": "arn:aws:s3:::${bucketName}/*"
          }
        }
      ],
      Version: '2012-10-17'
    }
  ]

  return addBucketEventToFunction
}
