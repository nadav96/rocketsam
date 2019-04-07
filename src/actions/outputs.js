'use strict';

const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const AWS = require("aws-sdk")
AWS.config.update({region:'eu-west-1'});

var cloudformation = new AWS.CloudFormation();

exports.getOutputs = async function () {
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting outputs"));
    return
  }
  var params = {
    StackName: settings.stackName
  };
  try {
    const result = await cloudformation.describeStacks(params).promise()
    const outputs = result["Stacks"][0]["Outputs"]
    outputs.forEach(function(output) {
      console.log(`${chalk.bold(output["OutputKey"])}: ${output["Description"]}`);
      console.log(`* ${chalk.yellow(output["OutputValue"])}`);
    })
  }
  catch (e) {
    console.log(chalk.red("Error fetching stack, is it deployed?"));
  }
};
