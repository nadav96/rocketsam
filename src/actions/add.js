'use strict';

const fs = require('fs-extra')
const yaml = require('js-yaml');
var chalk = require('chalk');
const path = require('path')
const meow = require('meow');
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined
var buildDir = undefined

module.exports = {
  add: async function() {
    const cli = getCli()
    
    const settings = await settingsParser()
		if (settings != undefined) {
        appDir = settings.appDir
        buildDir = settings.buildDir
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
      default:
        console.log(chalk.red(`incorrect syntax: ${cli.input[1]}`));
        console.log("rocketsam add event ${api/bucket} ${functionName}");
        break
    }
  }
}

function getCli() {
	return meow('', {
		flags: {
      endpoint: {
        type: 'string',
        alias: 'e'
      }
		}
	})
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
  const templateFile = `${appDir}/functions/${functionName}/template.yaml`
  try {
    var functionDoc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'))

    switch (eventType) {
      case "api":
        functionDoc["SammyApiEvent"] = {
          authorizerName: null,
          path: endpoint,
          method: "get"
        }
        break;
      case "bucket":
        functionDoc["SammyBucketEvent"] = {
          bucketName: {
            Ref: "MainBucket"
          },
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
        break
      default:
        console.log(chalk.red(`unknown event type supplied: ${eventType}`));
        console.log("rocketsam add event ${api/bucket} ${functionName}");
        break
    }

    fs.writeFileSync(templateFile, yaml.safeDump(functionDoc))
  }
  catch (e) {
    console.log(chalk.red(`function ${functionName} not found`));
  }
}
