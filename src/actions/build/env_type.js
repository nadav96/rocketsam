const chalk = require("chalk")
const path = require('path')
const yaml = require('js-yaml')
const safeLoadYaml = require("../shared/load-yaml")
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)
const fs = require('fs-extra');

exports.buildEnvFile = async function(functionName) {
    const settings = await settingsParser()

    if (settings == undefined) {
        console.log(chalk.red("Project not configured, aborting outputs"));
        return
    }

    if (!functionName) {
        console.log(chalk.red("Invalid function name supplied"));
        return
    }   

    const functionDoc = await getYaml(`${settings.appDir}/functions/${functionName}/template.yaml`)
    const skeletonDoc = await getYaml(`${settings.appDir}/template-skeleton.yaml`)

    switch(functionDoc.Runtime) {
      case "python3.7":
      case "python3.6":
        return await createPythonEnvFile(functionName, functionDoc, skeletonDoc, settings.appDir)
    }
}

async function createPythonEnvFile(functionName, functionDoc, skeletonDoc, appDir) {
    output = "# !!! Auto generated file !!!\n\n"
    output += "import os\n\n"

    var variables = []

    try {
        // Function specific variables
        const functionEnv = functionDoc["Environment"]["Variables"]
        for (key in functionEnv) {
            variables.push(key)
        }
    }
    catch (e) {}

    try {
        // Global variables
        const globalEnv = skeletonDoc["Globals"]["Function"]["Environment"]["Variables"]
        for (key in globalEnv) {
            if (!variables.includes(key)) {
                variables.push(key)
            }
        }
        
    }
    catch (e) {
    }


    for (key of variables) {
        const pythonicKey = key.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '_' + g[1].toLowerCase() });
        
        output += `def get_${pythonicKey}():\n`
        output += `    return os.environ["${key}"]\n\n`
    }

    const commonFolderPath = `${appDir}/functions/${functionName}/common`
    if (!fs.existsSync(commonFolderPath)){
        fs.mkdirsSync(commonFolderPath);
    }
    fs.writeFileSync(`${commonFolderPath}/env.py`, output)
}


async function getYaml(path) {
    return safeLoadYaml(path)
}