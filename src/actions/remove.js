'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const chalk = require("chalk")
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

module.exports = {
  remove: async function() {
    const settings = await settingsParser()
    if (settings == undefined) {
      console.log(chalk.red("Project not configured, aborting create"));
      return
		}

    const ps = spawnSync("aws", ["cloudformation", "delete-stack", "--stack-name", settings.stackName], { encoding: 'utf-8' })
    console.log(ps);
  }
}
