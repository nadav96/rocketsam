'use strict';

const fs = require('fs-extra');
const { spawnSync } = require('child_process');
const chalk = require("chalk")

const appDir = `${process.cwd()}/app`
const buildDir = `${process.cwd()}/.build`

module.exports = {
  deployProject: deployProject
}

function deployProject() {
  samPackageProject()
  samDeployProject()
}

function samPackageProject() {
  const storageBucketName = "randomnite-data"

  const ps = spawnSync('sam',
    ["package",
    "--template-file", `${buildDir}/template.yaml`,
    "--output-template-file", `${buildDir}/.packaged.yaml`,
    "--s3-bucket", storageBucketName],
    { encoding: 'utf-8' });
  if (ps.status == 0) {
    console.log("done packaging");
  }
  else {
    console.log(chalk.red("Failed packaging the project, please check your template file"))
  }
}

function samDeployProject() {
  const stackName = "ABC"

  const ps = spawnSync('sam',
    ["deploy",
    "--template-file", `${buildDir}/.packaged.yaml`,
    "--stack-name", stackName,
    "--capabilities","CAPABILITY_IAM"],
    { encoding: 'utf-8' });
  if (ps.status == 0) {
    console.log("done deploying");
  }
  else {
    console.log(chalk.red("Failed deploying the project, please check your template file"))
  }
}
