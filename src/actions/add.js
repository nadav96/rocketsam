'use strict';

const fs = require('fs-extra')
const yaml = require('js-yaml');
var chalk = require('chalk');
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined

module.exports = {
  add: async function(cli) {
    const settings = await settingsParser()
		if (settings != undefined) {
				appDir = settings.appDir
		}
		else {
			console.log(chalk.red("Project not configured, aborting add"));
			return
		}

    switch (cli.input[1]) {
      case "bucket":
        const bucketName = cli.input[2]
        if (bucketName != undefined) {
            addBucket(bucketName)
        }
        else {
          console.log("rocketsam add bucket ${bucketName}");
        }
        break
      case "event":
        const eventType = cli.input[2]
        const functionName = cli.input[3]
        var endpoint = cli.flags['endpoint']
        if(endpoint == '' || endpoint == undefined) {
          endpoint = `/${functionName}`
        }
        
        if (eventType != undefined && functionName != undefined) {
          addEventToFunction(eventType, functionName, endpoint)
        }
        else {
          console.log("rocketsam add event ${api/bucket} ${functionName}");
        }
        break
    }
  }
}

async function addBucket(bucketName) {
  const templateFile = `${appDir}/template-skeleton.yaml`
  var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));
  doc["Parameters"] = {
    bucketName: {
      Type: "String",
      Default: bucketName
    }
  }

  doc["Resources"]["MainBucket"] = {
    Type: "AWS::S3::Bucket",
    Properties: {
      BucketName: {
        'Fn::Sub': '${bucketName}'
      }
    }
  }

  fs.writeFileSync(templateFile, yaml.safeDump(doc))
}

async function addEventToFunction(eventType, functionName, endpoint) {
  const skeletonTemplateFile = `${appDir}/template-skeleton.yaml`
  const templateFile = `${appDir}/${functionName}/template.yaml`
  try {
    var skeletonnDoc = yaml.safeLoad(fs.readFileSync(skeletonTemplateFile, 'utf8'));
    var functionDoc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'))

    switch (eventType) {
      case "api":
        functionDoc["SammyApiEvent"] = {
          isAuthenticated: false,
          excludeSecurity: false,
          path: endpoint,
          method: "get"
        }
        break;
      case "bucket":
        if (skeletonnDoc["Resources"]["MainBucket"] != undefined) {
          functionDoc["SammyBucketEvent"] = {
            bucketName: "MainBucket",
            bucketEvent: "s3:ObjectCreated:*",
            Rules: [
              {
                Name: "suffix",
                Value: ".zip"
              },
              {
                Name: "prefix",
                Value: "uploads/"
              }
            ]
          }
        }
        else {
          console.log("No bucket available for event");
        }
        break
    }

    fs.writeFileSync(templateFile, yaml.safeDump(functionDoc))
  }
  catch (e) {
    console.log("error");
  }
}
