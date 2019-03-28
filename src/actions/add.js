'use strict';

const fs = require('fs-extra')
const yaml = require('js-yaml');

const appDir = `${process.cwd()}/app`

module.exports = {
  add: function(cli) {
    switch (cli.input[1]) {
      case "bucket":
        const bucketName = cli.input[2]
        if (bucketName != undefined) {
            addBucket(bucketName)
        }
        else {
          console.log("sammy add bucket ${bucketName}");
        }
        break
      case "event":
        const eventType = cli.input[2]
        const functionName = cli.input[3]

        if (eventType != undefined && functionName != undefined) {
          addEventToFunction(eventType, functionName)
        }
        else {
          console.log("sammy add event ${api/bucket} ${functionName}");
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

async function addEventToFunction(eventType, functionName) {
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
          path: "/demo",
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
