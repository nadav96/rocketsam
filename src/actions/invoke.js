'use strict';

const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const yaml = require('js-yaml')
const fs = require('fs-extra');
const { spawn } = require('child_process');
const build = require("./build.js")

exports.invoke = async function (functionName, flags) {
    const settings = await settingsParser()

    if (settings == undefined) {
        console.log(chalk.red("Project not configured, aborting outputs"));
        return
    }

    if (!functionName) {
        console.log(chalk.red("Invalid function name supplied"));
        return
    }   

    if (flags["build"]) {
        await build.build(functionName)
    }

    const templatePath = `${settings.appDir}/functions/${functionName}/template.yaml`
    
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

    const buildTemplatePath = `${settings.buildDir}/template.yaml`
    const functionEventPath = `${settings.appDir}/functions/${functionName}/event.json`

    const isExists = await Promise.all(
        [
            fs.existsSync(buildTemplatePath),
            fs.existsSync(functionEventPath)
        ]
    ) 

    const envPath = await createEnvFile(functionName, functionTemplateName, settings.appDir, settings.buildDir)

    if ( ! isExists[0] ) {
        console.log(chalk.red("build template missing, please build your project first"));
        
        return
    } else if ( ! isExists[1] ) {
        console.log(chalk.red("event.json in the function folder was not found, it's crucial for the invoke process"));
        
        return
    }

    const command = [
        "local", "invoke", 
        functionTemplateName,
        "-t", buildTemplatePath,
        "-e", functionEventPath,
        "-n", envPath
    ]

    var child = spawn('sam', command,
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

async function createEnvFile(functionName, functionTemplateName, appDir, buildDir) {
    const buildEnvPath = `${buildDir}/env.json`
    const functionEnv = {}

    try {
        // use the global settings if exists (the default values)
        const globalEnv = JSON.parse(fs.readFileSync(`${appDir}/env.json`))
        Object.assign(functionEnv, globalEnv);
    }
    catch (e) {

    }

    try {
        // use the global settings if exists (the default values)
        const globalEnv = JSON.parse(fs.readFileSync(`${appDir}/functions/${functionName}/env.json`))
        Object.assign(functionEnv, globalEnv);
    }
    catch (e) {
    }

    var buildEnv = {}
    try {
        buildEnv = JSON.parse(fs.readFileSync(buildEnvPath))
    }
    catch (e) {
    }

    buildEnv[functionTemplateName] = functionEnv
    
    fs.writeJSONSync(buildEnvPath, buildEnv)
    
    return buildEnvPath
}