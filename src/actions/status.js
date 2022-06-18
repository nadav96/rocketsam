'use strict';

// TODO: fix

const fs = require('fs');
const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const chalk = require("chalk")
const yaml = require('js-yaml')
const safeLoadYaml = require("./shared/load-yaml")

const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined

module.exports = {
	status: async function() {
		const settings = await settingsParser()
		if (settings != undefined) {
				appDir = settings.appDir
		}
		else {
			console.log(chalk.red("Project not configured, aborting create"));
			return
		}

		const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory())
		for (var dir of dirs(`${appDir}/functions`)) {
			await listFunction(dir)
		}
	}
}

async function listFunction(dir) {
	console.log(chalk.green.bold("F: ") + chalk.green(dir))

	const templateFile = `${appDir}/functions/${dir}/template.yaml`
	var doc = await safeLoadYaml(templateFile);
	if (doc["SammyApiEvent"] != undefined) {
		const isApiStatus = chalk.yellow(doc["SammyApiEvent"]["path"])
		console.log(chalk.bold("Api: ") + isApiStatus)
	}
	if (doc["SammyBucketEvent"] != undefined) {
		console.log(chalk.bold("bucket: ") + `${doc["SammyBucketEvent"]["bucketName"]}, ${doc["SammyBucketEvent"]["bucketEvent"]}`);
		console.log(yaml.dump(doc["SammyBucketEvent"]["Rules"]));
		
	}

	if (doc["Events"] != undefined) {
		console.log(chalk.bold("Custom event"));
	}
	console.log()
}