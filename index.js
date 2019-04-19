#!/usr/bin/env node

'use strict';
const cli = require('./src/meow.js').getCli();
const chalk = require("chalk")
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');
 
const actionsPath = "./src/actions"

updateNotifier({pkg}).notify();

switch(cli.input[0]) {
	// RocketSam CLI
	case "init":
		require(`${actionsPath}/init.js`).init(cli)
		break
	case "build":
		require(`${actionsPath}/build.js`).build(cli.input[1])
		break;
	case "template":
		require(`${actionsPath}/template.js`).createTemplate()
		break
	case "add":
		require(`${actionsPath}/add.js`).add(cli)
		break
	case "install":
		require(`${actionsPath}/build/install_util.js`)
				.installPythonRequirements(cli.input[1])
		break;
	case "create":
		require(`${actionsPath}/create.js`).create(cli.input[1])
		break
	case "status":
		require(`${actionsPath}/status.js`).status()
		break;
	case "local":
		require(`${actionsPath}/local-api.js`).samStartLocalApi()
		break
	case "deploy":
		require(`${actionsPath}/deploy.js`).deployProject()
		break
	case "outputs":
		require(`${actionsPath}/outputs.js`).getOutputs()
		break
	case "logs":
		require(`${actionsPath}/logs.js`).getLogs(cli.input[1])
		break
	case "remove":
		require(`${actionsPath}/remove.js`).remove()
		break
	case "help":
		require(`${actionsPath}/help.js`).help()
		break;
	default:
		console.log(chalk.red(`No command named ${cli.input[0]}`))
		break;
}
