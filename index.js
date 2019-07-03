#!/usr/bin/env node

'use strict';
const meow = require('meow');
const chalk = require("chalk")
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');
 
const actionsPath = "./src/actions"

updateNotifier({pkg}).notify();

const cli = getCli()

switch(cli.input[0]) {
	// RocketSam CLI
	case "init":
		require(`${actionsPath}/init.js`).init()
		break
	case "build":
		require(`${actionsPath}/build.js`).build(cli.input[1])
		break;
	case "common":
		require(`${actionsPath}/common.js`).common()
		break;
	case "template":
		require(`${actionsPath}/template.js`).createTemplate()
		break
	case "add":
		require(`${actionsPath}/add.js`).add()
		break
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
	case "invoke":
		require(`${actionsPath}/invoke.js`).invoke(cli.input[1])
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

function getCli() {
	return meow('', {
	})
}