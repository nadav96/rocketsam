'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml')
const path = require('path');

module.exports = parseSettings

async function parseSettings() {
  const settings = await getRocketSamSettings()
  if (settings != undefined) {
    return {
      appDir: settings["appDir"].replace("$", process.cwd()),
      buildDir: settings["buildDir"].replace("$", process.cwd()),
      storageBucketName: settings["storageBucketName"].replace("$", process.cwd()),
      stackName: settings["stackName"].replace("$", process.cwd())
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