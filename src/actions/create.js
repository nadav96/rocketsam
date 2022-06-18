'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const safeLoadYaml = require("./shared/load-yaml")

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
			const answers = await inquirer.prompt([
				{
				  type: 'list',
				  name: 'value',
				  message: 'select runtime:',
				  choices: [
					  "nodejs16.x",
					  "nodejs14.x",
					  "nodejs12.x",
					  "nodejs10.x",
					  "python3.9",
					  "python3.6",
					  "python3.7"
				  ]
				}
			  ])
			const runtime = answers['value']

			const functionDir = `${appDir}/functions/${name}`

			fs.mkdirsSync(functionDir)

			var files = ["template.yaml", "event.json"]

			switch(runtime) {
				case "python3.7":
				case "python3.6":
					files = files.concat(["python3.6/function.py", "python3.6/requirements.txt"])
					break
				case "nodejs10.x":
					files = files.concat(["node10.x/function.js", "node10.x/package.json"])
					break
			}

			fs.writeFileSync(`${functionDir}/.gitignore`, "common")

			for (var i = 0; i < files.length; i++) {
				const filePath = `${scriptDir}/template/${files[i]}` 
				fs.copyFileSync(filePath, `${functionDir}/${path.basename(filePath)}`);
			};

			try {
				const templateFile = `${functionDir}/template.yaml`
				var doc = await safeLoadYaml(templateFile);
				doc.Name = `${name}Function`
				doc.Runtime = runtime
				fs.writeFileSync(templateFile, yaml.dump(doc))
			} catch (e) {
			console.log(e);
			}

		}
		else {
			console.log("Invalid function name supplied")
		}
	}
}
