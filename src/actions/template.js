'use strict';

const fs = require('fs-extra')
const { readdirSync, statSync } = require('fs-extra')
const { join } = require('path')
const path = require('path')

const yaml = require('js-yaml')
var chalk = require('chalk');
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined
var buildDir = undefined
var skeletonTemplateFile = undefined

module.exports = {
  createTemplate: async function() {
    const settings = await settingsParser()
    if (settings != undefined) {
        appDir = settings.appDir
        buildDir = settings.buildDir
        skeletonTemplateFile = `${buildDir}/template.yaml`
    }
    else {
      console.log(chalk.red("Project not configured, aborting build"));
      return
    }

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
    const functionTimeout = functionDoc["Timeout"]
    const env = functionDoc["Environment"]

    const staticFunctionPropertiesDoc = {
      CodeUri: `./${functionName}.zip`,
      Handler: "function.handler",
      Runtime: "python3.6",
      Timeout: 10,
      Events: {}
    }

    const mergedFunctionPropertiesDoc = Object.assign(staticFunctionPropertiesDoc, functionDoc)
    delete mergedFunctionPropertiesDoc["Name"]
    delete mergedFunctionPropertiesDoc["SammyApiEvent"]
    delete mergedFunctionPropertiesDoc["SammyBucketEvent"]

    skeletonDoc["Resources"][functionResourceName] = {
      Type: "AWS::Serverless::Function",
      Properties: mergedFunctionPropertiesDoc
    }

    if (functionDoc["SammyApiEvent"] != undefined) {
      console.log(`* ${functionName} api event available`)
      addApiEventToFunction(functionDoc, skeletonDoc)
    }
    if (functionDoc["SammyBucketEvent"] != undefined) {
      console.log(`* ${functionName} bucket event available`)
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

  if (skeletonDoc["Resources"]["ApiGateway"] == undefined) {
    skeletonDoc["Resources"]["ApiGateway"] = {
      Type: "AWS::Serverless::Api",
      Properties: {
        StageName: "prod",
        DefinitionBody: {
          swagger: 2.0,
          info: {
            title: {
              Ref: "AWS::StackName"
            }
          },
          paths: {}
        }
      }
    }
  }

  const functionARN = "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${"+
    functionResourceName + ".Arn}/invocations"

  var endpoint = {}
  endpoint[method] = {
    responses: {},
    "x-amazon-apigateway-integration": {
      httpMethod: "post",
      type: "aws_proxy",
      uri: {
        "Fn::Sub": functionARN
      }
    }
  }
  if (excludeSecurity == false) {
    endpoint[method]["security"] = [
      {
        auth_tokenorizer: []
      }
    ]
  }

  skeletonDoc["Resources"]["ApiGateway"]
    ["Properties"]["DefinitionBody"]["paths"][path] = endpoint

  // Now add to the actual function resource
  skeletonDoc["Resources"][functionResourceName]["Properties"]
    ["Events"]["ApiEvent"] = {
      Type: "Api",
      Properties: {
        Method: method,
        Path: path,
        RestApiId: {
          Ref: "ApiGateway"
        }
      }
  }

  if (skeletonDoc["Outputs"] == undefined) {
    skeletonDoc["Outputs"] = {}
  }
  skeletonDoc["Outputs"][`${functionResourceName}Endpoint`] = {
    Description: "API Prod stage endpoint",
    Value: {
      'Fn::Sub': `https://\${ApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/prod${path}`
    }
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
    Type: "S3",
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
