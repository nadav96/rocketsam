'use strict';

const fs = require('fs-extra');
const unzip = require('unzip');
const yaml = require('js-yaml');
const path = require('path');
const chalk = require("chalk")
var inquirer = require('inquirer');
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined
const scriptDir = path.dirname(require.main.filename);

module.exports = {
	create: async function(name) {
		const settings = await settingsParser()
		if (settings != undefined) {
				appDir = settings.appDir
		}
		else {
			console.log(chalk.red("Project not configured, aborting create"));
			return
		}

		if (name) {
			await fs.mkdirSync(`${appDir}/${name}`, { recursive: true })

			const files = ["function.py", "requirements.txt", "template.yaml"]
			for (var i = 0; i < files.length; i++) {
				const filePath = `${scriptDir}/template/function/${files[i]}`
				await fs.copyFileSync(filePath, `${appDir}/${name}/${files[i]}`);
			};

			try {
				const templateFile = `${appDir}/${name}/template.yaml`
				var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));
				doc.Name = `${name}Function`
				fs.writeFileSync(templateFile, yaml.safeDump(doc))
			} catch (e) {
			console.log(e);
			}

		}
		else {
			console.log("Invalid function name supplied")
		}
	}
}
