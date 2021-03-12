'use strict';

const Q = require('q');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

module.exports.samStartLocalApi = async function() {
  samStartLocalApi()
}

async function samStartLocalApi() {
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting deploy"));
    return
  }

  var deferred = Q.defer();

  var command = [
    "local", "start-api",
    "-t", `${settings.buildDir}/template.yaml`
  ]

  const isEnvExists = await fs.existsSync(`${settings.buildDir}/env.json`)
  if (isEnvExists) {
    command.push("-n")
    command.push(`${settings.buildDir}/env.json`)
  }

  const child = spawn('sam', command, { encoding: 'utf-8' });

  child.stdout.on('data', function(code) {
    process.stdout.write(code);
  })

  child.stderr.on('data', function(error) {
    process.stderr.write(error);
  })

  child.on('close', function(code) {
    deferred.resolve()
  })

  return deferred.promise
}