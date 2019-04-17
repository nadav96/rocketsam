'use strict';

const Q = require('q');
const fs = require('fs-extra');
const { spawnSync, spawn } = require('child_process');
const chalk = require("chalk")
const path = require('path')
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

  await samPackageProject(settings.buildDir, settings.storageBucketName, settings.region)
  await samDeployProject(settings.buildDir, settings.stackName, settings.region)
}

function samPackageProject(buildDir, storageBucketName, region) {
  var deferred = Q.defer();

  var child = spawn('sam',
    ["package",
    "--template-file", `${buildDir}/template.yaml`,
    "--output-template-file", `${buildDir}/.packaged.yaml`,
    "--s3-bucket", storageBucketName,
    "--region", region],
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

function samDeployProject(buildDir, stackName, region) {
  var deferred = Q.defer();

  const child = spawn('sam',
    ["deploy",
    "--template-file", `${buildDir}/.packaged.yaml`,
    "--stack-name", stackName,
    "--capabilities","CAPABILITY_IAM",
    "--region", region],
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
