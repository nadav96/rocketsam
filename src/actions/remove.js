'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const chalk = require("chalk")
const path = require('path')
const AWS = require("aws-sdk")
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

AWS.config.update({region:'eu-west-1'});
var cloudformation = new AWS.CloudFormation();


module.exports = {
  remove: async function() {
    const settings = await settingsParser()
    if (settings == undefined) {
      console.log(chalk.red("Project not configured, aborting create"));
      return
    }

    console.log("Removing stack");

    const ps = spawnSync("aws", ["cloudformation", "delete-stack", "--stack-name", settings.stackName], { encoding: 'utf-8' })
    
    var i = 0
    while (await getStackExists(settings.stackName, i) == true) {
      await sleep(1*500)
      i += 1
    }    
    console.log("\nRemoved stack");
    
  }
}

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

async function getStackExists(stackName, i) {
  var params = {
    StackName: stackName
  };
  try {
    const result = await cloudformation.describeStacks(params).promise()
    const stackStatus = result["Stacks"][0]["StackStatus"]
    
    process.stdout.write(`\rStack status (${i}): ${chalk.yellow(stackStatus)}`);
    
    return true
  }
  catch (e) {
    process.stdout.write(`\rStack status (${i}): ${chalk.green("REMOVED")}`);
    return false
  }
}