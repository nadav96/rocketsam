#!/usr/bin/env node

'use strict';
const cli = require('./src/meow.js').getCli();

const actionsPath = "./src/actions"

switch(cli.input[0]) {
	case "init":
		console.log("Init")
		require(`${actionsPath}/init.js`).init()
		break
	case "build":
		require(`${actionsPath}/build.js`).build(cli.input[1])
		break;
	case "install":
		require(`${actionsPath}/build/install_util.js`).installPythonRequirements(cli.input[1])
		break;
	case "create":
		require(`${actionsPath}/create.js`).create(cli.input[1])
		break
	case "status":
		require(`${actionsPath}/status.js`).status()
		break;
	case "help":
		cli.showHelp()
		break;
	default:
		console.log(`No command named ${cli.input[0]}`)
		break;
}
