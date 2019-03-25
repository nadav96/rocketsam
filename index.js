#!/usr/bin/env node

'use strict';
const cli = require('./src/meow.js').getCli();


switch(cli.input[0]) {
	case "init":
		console.log("Init")
		require("./src/actions/init.js").init()
		break
	case "build":
		require("./src/actions/build.js").build()
		break;
	case "create":
		require("./src/actions/create.js").create(cli.input[1])
		break
	default:
		console.log(`No command named ${cli.input[0]}`)
		break;
}