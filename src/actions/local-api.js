'use strict';

const fs = require('fs-extra');
const { spawnSync, spawn } = require('child_process');
const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

module.exports.samStartLocalApi = samStartLocalApi

async function samStartLocalApi() {
  const settings = await settingsParser()
  if (settings == undefined) {
    console.log(chalk.red("Project not configured, aborting deploy"));
    return
  }

  // sam local start-api -t .build/template.yaml -n ./sam_local_env.json

  const child = spawn('sam',[
      "local",
    "start-api",
    "-t", `${settings.buildDir}/template.yaml`
  ], { encoding: 'utf-8' });

  child.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
      //Here is where the output goes
  });
  child.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
      //Here is where the error output goes
  });
  child.on('close', function(code) {
      console.log('closing code: ' + code);
      //Here you can get the exit code of the script
  });

}
