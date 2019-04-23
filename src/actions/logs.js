'use strict';

const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const yaml = require('js-yaml')
const fs = require('fs-extra');
const { spawnSync, spawn } = require('child_process');
const AWS = require("aws-sdk")

exports.getLogs = async function (functionName) {
    const settings = await settingsParser()
    if (settings == undefined) {
        console.log(chalk.red("Project not configured, aborting outputs"));
        return
    }

    if (!functionName) {
        console.log(chalk.red("Invalid function name supplied"));
        return
    }

    AWS.config.update({region: settings.region});
    var cloudwatch = new AWS.CloudWatchLogs();

    
    const templatePath = `${settings.appDir}/${functionName}/template.yaml`
    
    var functionTemplateName = undefined
    try {
        var functionTemplate = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'));
        functionTemplateName = functionTemplate["Name"]
    }
    catch (e) {
        console.log(chalk.red("Function template not found, please validate that this file exists:"));
        console.log(templatePath);
        
        return
    }

    var child = spawn('sam',
    ["logs",
    "-n", functionTemplateName,
    "--stack-name", settings.stackName,
    "--tail"],
    { encoding: 'utf-8' , shell: true, customFds: [0,1,2]})

    try {
        child.stdout.on('data', function(code) {
            process.stdout.write(code);
        })
        
        child.stderr.on('data', function(error) {
            process.stderr.write(error);
        })
    }
    catch(e) {

    }
}