'use strict';

const Q = require('q');
const fs = require('fs-extra');
const { spawnSync, spawn } = require('child_process');
const chalk = require("chalk")
const path = require('path')
const yaml = require('js-yaml')
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
  await fs.removeSync(outputsPath)

  const params = getTemplateParams(settings)
  
  await samPackageProject(settings.buildDir, settings.storageBucketName, settings.region)
  await samDeployProject(settings.buildDir, settings.stackName, settings.region, params)
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

function samDeployProject(buildDir, stackName, region, params) {
  var deferred = Q.defer();

  const child = spawn('sam',
    ["deploy",
    "--template-file", `${buildDir}/.packaged.yaml`,
    "--stack-name", stackName,
    "--capabilities","CAPABILITY_IAM",
    "--region", region,
    "--parameter-overrides", params],
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

function getTemplateParams(settings) {
  const skeletonTemplateFile = `${settings.buildDir}/template.yaml`
  const skeletonDoc = yaml.safeLoad(fs.readFileSync(skeletonTemplateFile, 'utf8'));
  const params = skeletonDoc["Parameters"]

  var result = ""
  Object.keys(params).forEach(function(key) {
    var val = params[key]["Default"];
    result += `${key}='${val}' `
  });

  return result  
}