'use strict';

const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const yaml = require('js-yaml')
const fs = require('fs-extra');

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
    
    var params = {
        logGroupNamePrefix: `/aws/lambda/${settings.stackName}-${functionTemplateName}`
    };
    const res = await cloudwatch.describeLogGroups(params).promise()
 
    if (res.logGroups.length == 0) {
        console.log("Log groups for function not found");
        return
    }
    const logGroupName = res.logGroups[res.logGroups.length - 1].logGroupName
    
    var lastEventId = undefined
    while (true) {
        sleep(1 * 1000)
        lastEventId = await printLogsForName(cloudwatch, logGroupName, lastEventId)
    }
}

async function printLogsForName(cloudwatch, logGroupName, lastEventId) {
    var params = {
        logGroupName: logGroupName,
        // Five minutes earlier
        startTime: new Date().getTime() - 300000
    }
    const res = await cloudwatch.filterLogEvents(params).promise()

    if (res.events.length == 0) {
        return undefined
    }

    var previousLastIndex = 0
    if (lastEventId) {
        previousLastIndex = res.events.findIndex(e => e.eventId == lastEventId)
        if (previousLastIndex != -1) {
            if (res.events.length - previousLastIndex == 1) {
                return lastEventId
            }
        }
        else {
            previousLastIndex = 0
        }
    }
    
    // New logs where found, print them and return the new last event id
    for (let i = previousLastIndex; i < res.events.length; i++) {
        const e = res.events[i];
        console.log(e.message);
        
    }

    return res.events[res.events.length - 1].eventId
}

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));