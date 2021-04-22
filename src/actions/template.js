'use strict';

// TODO: fix

const fs = require('fs-extra')
const { readdirSync, statSync } = require('fs-extra')
const { join } = require('path')
const path = require('path')
var glob = require("glob")
const yaml = require('js-yaml')
const safeLoadYaml = require("./shared/load-yaml")

var chalk = require('chalk');
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined
var buildDir = undefined
var resourcesDir = undefined
var skeletonTemplateFile = undefined

module.exports = {
  createTemplate: async function() {
    const settings = await settingsParser()
    if (settings != undefined) {
        appDir = settings.appDir
        buildDir = settings.buildDir
        resourcesDir = settings.resourcesDir
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
  await fs.mkdirsSync(`${buildDir}`)
  await fs.copyFileSync(`${appDir}/template-skeleton.yaml`, skeletonTemplateFile)

  await addResourcesToTemplate()

  const functions = await getFunctions()
  for (var i = 0; i < functions.length; i++) {
    await appendFunctionTemplate(functions[i])
  }  
}

async function getFunctions() {
  const dirsFunction = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory())
  return await dirsFunction(`${appDir}/functions`)
}

async function appendFunctionTemplate(functionName) {
  const templateFile = `${appDir}/functions/${functionName}/template.yaml`
  try {
    var skeletonDoc = await safeLoadYaml(skeletonTemplateFile);
    var functionDoc = await safeLoadYaml(templateFile)

    // TODO: not using important values?
    const functionResourceName = functionDoc["Name"]
    const functionTimeout = functionDoc["Timeout"]
    const env = functionDoc["Environment"]

    const staticFunctionPropertiesDoc = {
      CodeUri: `./functions/${functionName}.zip`,
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

    addCloudwatchUrl(functionDoc, skeletonDoc)

    if (functionDoc["SammyApiEvent"] != undefined) {
      console.log(`* ${chalk.yellow("API Event")} ${functionName} added`);
      addApiEventToFunction(functionDoc, skeletonDoc)
    }
    if (functionDoc["SammyBucketEvent"] != undefined) {
      console.log(`* ${chalk.yellow("Bucket Event")} ${functionName} added`);
      addBucketEventToFunction(functionDoc, skeletonDoc)
    }

    fs.writeFileSync(skeletonTemplateFile, yaml.dump(skeletonDoc))
  }
  catch (e) {
    console.log(e);
  }
}

function addCloudwatchUrl(functionDoc, skeletonDoc) {
  const functionResourceName = functionDoc["Name"]

  if (skeletonDoc["Outputs"] == undefined) {
    skeletonDoc["Outputs"] = {}
  }

  skeletonDoc["Outputs"][`cloudwatch${functionResourceName}`] = {
    Description: "cloudwatch url",
    Value: {
      'Fn::Sub': `https://\${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=\${AWS::Region}#logEventViewer:group=/aws/lambda/\${${functionResourceName}\};start=PT30S`
    }
  }
}


function addApiEventToFunction(functionDoc, skeletonDoc) {
  const functionResourceName = functionDoc["Name"]
  const apiEvent = functionDoc["SammyApiEvent"]
  const authorizerName = apiEvent["authorizerName"]
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
  if (authorizerName != null) {
    const authObject = {}
    authObject[authorizerName] = [] 
    endpoint[method]["security"] = [authObject]
  }
  
  const pathObject = skeletonDoc["Resources"]["ApiGateway"]
    ["Properties"]["DefinitionBody"]["paths"][path]

  if (pathObject == undefined) {
    skeletonDoc["Resources"]["ApiGateway"]
      ["Properties"]["DefinitionBody"]["paths"][path] = endpoint
  }
  else {
    skeletonDoc["Resources"]["ApiGateway"]
      ["Properties"]["DefinitionBody"]["paths"][path][method] = endpoint[method]  

  }

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
  skeletonDoc["Outputs"][`endpoint${functionResourceName}`] = {
    Description: "API Prod stage endpoint",
    Value: {
      'Fn::Sub': `https://\${ApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/\${ApiGateway.Stage}${path}`
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
      Bucket: bucketName,
      Events: bucketEvent,
      Filter: {
        S3Key: {
          Rules: rules
        }
      }
    }
  }

  return addBucketEventToFunction
}

async function addResourcesToTemplate() {
  const resources = glob.sync(`${resourcesDir}/**/*.yaml`, {
    nodir: true
  })

  var skeletonDoc = await safeLoadYaml(skeletonTemplateFile);

  for (const resource of resources) {
    try {
      var resourceDoc = await safeLoadYaml(`${resource}`);
      if (skeletonDoc["Resources"] == undefined) {
        skeletonDoc["Resources"] = {}
      }
      Object.keys(resourceDoc).forEach(key => {
        console.log(`* ${chalk.yellow("Resource")} ${key} added`);
        
        skeletonDoc["Resources"][key] = resourceDoc[key]
      })
    }
    catch (e) {
      console.log(chalk.red(`${resource} is invalid`));
    }
  }
  fs.writeFileSync(skeletonTemplateFile, yaml.dump(skeletonDoc))
}

