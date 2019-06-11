'use strict';

const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const AWS = require("aws-sdk")

exports.getOutputs = async function (flags) {
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting outputs"));
    return
  }
  
  const prefix = flags["prefix"]
  const trim = flags["trim"]

  AWS.config.update({region: settings.region});
  var cloudformation = new AWS.CloudFormation();

  var params = {
    StackName: settings.stackName
  };
  try {
    const result = await cloudformation.describeStacks(params).promise()
    const outputs = result["Stacks"][0]["Outputs"]
    outputs.filter(function(output) {
      return output["OutputKey"].startsWith(prefix)
    }).forEach(function(output) {
      const key = trim ? output["OutputKey"].substring(prefix.length) : output["OutputKey"]

      console.log(`${chalk.bold(key)}: ${output["Description"]}`);
      console.log(`* ${chalk.yellow(output["OutputValue"])}`);
    })
  }
  catch (e) {
    console.log(chalk.red("Error fetching stack, is it deployed?"));
  }
};
