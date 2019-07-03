'use strict';

const chalk = require("chalk")
const fs = require('fs-extra')
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const AWS = require("aws-sdk")
const meow = require('meow');

exports.getOutputs = async function () {
  const cli = getCli()
  
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting outputs"));
    return
  }
  
  const prefix = cli.flags["prefix"]
  const query = cli.flags["query"]
  const trim = cli.flags["trim"]

  const isForce = cli.flags["force"]

  try {
    var outputs = null
    if (!isForce) {
      outputs = await getOutputsFromCache(settings)
    }

    if (!outputs) {
      outputs = await fetchOutputs(settings)
    }

    outputs.filter(function(output) {
      const key = output["OutputKey"]
      return key.startsWith(prefix) && key.includes(query)
    }).forEach(function(output) {
      const key = trim ? output["OutputKey"].substring(prefix.length) : output["OutputKey"]

      console.log(`${chalk.bold(key)}: ${output["Description"]}`);
      console.log(`* ${chalk.yellow(output["OutputValue"])}`);
    })
  }
  catch (e) {
    console.log(e);
    
    console.log(chalk.red("Error fetching stack, is it deployed?"));
  }
};

function getCli() {
	return meow('', {
		flags: {
      prefix: {
        type: 'string',
        alias: 'p',
        default: ''
      },
      trim: {
        type: 'boolean',
        alias: 't'					
      },
      force: {
        type: 'boolean',
        alias: 'f'					
      },
      query: {
        type: 'string',
        alias: 'q',
        default: ''				
      }
		}
	})
}

async function getOutputsFromCache(settings) {
  const outputsPath = `${settings.buildDir}/outputs.json`
  const isExists = await fs.existsSync(outputsPath)
  if (isExists) {
    const result = await fs.readFileSync(outputsPath)
    return JSON.parse(result)
  }
  else {
    return null
  }
}

async function fetchOutputs(settings) {
  var params = {
    StackName: settings.stackName
  };

  AWS.config.update({region: settings.region});
  var cloudformation = new AWS.CloudFormation();

  const result = await cloudformation.describeStacks(params).promise()
  const outputs = result["Stacks"][0]["Outputs"]
  
  fs.writeFileSync(`${settings.buildDir}/outputs.json`, JSON.stringify(outputs))
  return outputs
}
