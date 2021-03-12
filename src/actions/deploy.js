'use strict';

const Q = require('q');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const chalk = require("chalk")
const path = require('path')
const safeLoadYaml = require("./shared/load-yaml")

var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

module.exports = {
  deployProject: deployProject
}

async function deployProject() {
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting deploy"));
    return
  }

  const outputsPath = `${settings.buildDir}/outputs.json`
  fs.removeSync(outputsPath)

  const params = await getTemplateParams(settings)
  
  await samPackageProject(settings.buildDir, settings.storageBucketName, settings.storageBucketPrefix, settings.region)
  await samDeployProject(settings.buildDir, settings.stackName, settings.region, params)
}

function samPackageProject(buildDir, storageBucketName, prefix, region) {
  var deferred = Q.defer();

  var code =  [ "package",
    "--template-file", `${buildDir}/template.yaml`,
    "--output-template-file", `${buildDir}/.packaged.yaml`,
    "--s3-bucket", storageBucketName,
    "--region", region
  ]

  if (prefix && prefix != "") {
    code.push("--s3-prefix", prefix)
  }

  var child = spawn('sam',
    code,
    { encoding: 'utf-8' , shell: true}
  )

  child.stdout.on('data', function(code) {
    process.stdout.write(code);
  })
  
  child.stderr.on('data', function(error) {
    process.stderr.write(error);
  })

  child.on('close', function(code) {
    deferred.resolve()
  })

  return deferred.promise
}

function samDeployProject(buildDir, stackName, region, params) {
  var deferred = Q.defer();

  var command = ["deploy",
    "--template-file", `${buildDir}/.packaged.yaml`,
    "--stack-name", stackName,
    "--capabilities","CAPABILITY_IAM",
    "--region", region
  ]

  if (params && params.length > 0) {
    command.push("--parameter-overrides", params)
  }

  const child = spawn('sam', command,
    { encoding: 'utf-8' , shell: true})
  
  child.stdout.on('data', function(code) {
    process.stdout.write(code);
  })

  child.stderr.on('data', function(error) {
    process.stderr.write(error);
  })

  child.on('close', function(code) {
    deferred.resolve()
  })

  return deferred.promise
}

async function getTemplateParams(settings) {
  const skeletonTemplateFile = `${settings.buildDir}/template.yaml`
  const skeletonDoc = await safeLoadYaml(skeletonTemplateFile);
  const params = skeletonDoc["Parameters"]

  if (params) {
    var result = ""
    Object.keys(params).forEach(function(key) {
      var val = params[key]["Default"];
      result += `${key}='${val}' `
    });
  
    return result  
  }
  else {
    return null
  }
}