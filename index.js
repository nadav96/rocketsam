#!/usr/bin/env node

'use strict';
const cli = require('./meow.js').getCli();


switch(cli.input[0]) {
	case "init":
		console.log("Init")
		require("./init.js").init()
		break
	case "build":
		require("./build.js").build()
		break;
	case "create":
		require("./create.js").create(cli.input[1])
		break
	default:
		console.log(`No command named ${cli.input[0]}`)
		break;
}