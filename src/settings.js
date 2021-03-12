'use strict';

const safeLoadYaml = require("./actions/shared/load-yaml")

const chalk = require('chalk')
module.exports = parseSettings

async function parseSettings() {
  const settings = await safeLoadYaml(`${process.cwd()}/rocketsam.yaml`)
  if (settings != undefined) {
    try {
      return {
        appDir: settings["appDir"].replace("$", process.cwd()),
        buildDir: settings["buildDir"].replace("$", process.cwd()),
        commonDir: settings["commonDir"].replace("$", process.cwd()),
        resourcesDir: settings["resourcesDir"].replace("$", process.cwd()),
        storageBucketName: settings["storageBucketName"].replace("$", process.cwd()),
        storageBucketPrefix: settings["storageBucketPrefix"] ? settings["storageBucketPrefix"] : "", 
        stackName: settings["stackName"].replace("$", process.cwd()),
        region: settings["region"]
      }
    }
    catch (e) {
      console.log(chalk.red("One of the required feilds of the rocketsam.yaml file is missing, please refer to the readme for more info"));
      
      return undefined
    }
  } else {
    return undefined
  }
}