'use strict';

const fs = require('fs-extra');
const { spawnSync } = require('child_process');
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

  samPackageProject(settings.buildDir, settings.storageBucketName)
  samDeployProject(settings.buildDir, settings.stackName)
}

function samPackageProject(buildDir, storageBucketName) {

  const ps = spawnSync('sam',
    ["package",
    "--template-file", `${buildDir}/template.yaml`,
    "--output-template-file", `${buildDir}/.packaged.yaml`,
    "--s3-bucket", storageBucketName],
    { encoding: 'utf-8' , shell: true});
  if (ps.status == 0) {
    console.log("done packaging");
  }
  else {
    console.log(chalk.red("Failed packaging the project, please check your template file"))
    console.log(ps);
  }
}

function samDeployProject(buildDir, stackName) {
  const ps = spawnSync('sam',
    ["deploy",
    "--template-file", `${buildDir}/.packaged.yaml`,
    "--stack-name", stackName,
    "--capabilities","CAPABILITY_IAM"],
    { encoding: 'utf-8' , shell: true});
  if (ps.status == 0) {
    console.log("done deploying");
  }
  else {
    console.log(chalk.red("Failed deploying the project, please check your template file"))
  }

  console.log(ps);
}
