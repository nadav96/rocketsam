'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml')
const path = require('path');
const chalk = require('chalk')
module.exports = parseSettings

async function parseSettings() {
  const settings = await getRocketSamSettings()
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

async function getPropertyFromSettings(property) {
  const settings = await getRocketSamSettings()
  return settings[property].replace("$", process.cwd())
}

async function getRocketSamSettings() {
  try {
    var doc = yaml.safeLoad(fs.readFileSync(`${process.cwd()}/rocketsam.yaml`, 'utf8'));
    return doc
  }
  catch (e) {
    console.log("rocketsam not found, is project configured?");
  }
}
