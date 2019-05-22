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
			const answers = await inquirer.prompt([
				{
				  type: 'list',
				  name: 'value',
				  message: 'select runtime:',
				  choices: [
					  "nodejs8.10",
					  "python3.6",
					  "python3.7"
				  ]
				}
			  ])
			const runtime = answers['value']

			const functionDir = `${appDir}/functions/${name}`

			await fs.mkdirSync(functionDir, { recursive: true })

			var files = ["template.yaml", "event.json"]

			switch(runtime) {
				case "python3.7":
				case "python3.6":
					files = files.concat(["python3.6/function.py", "python3.6/requirements.txt", "python3.6/.gitignore"])
					break
				case "nodejs8.10":
					files = files.concat(["node8.1/function.js", "node8.1/package.json", "node8.1/.gitignore"])
					break
			}

			for (var i = 0; i < files.length; i++) {
				const filePath = `${scriptDir}/template/${files[i]}` 
				await fs.copyFileSync(filePath, `${functionDir}/${path.basename(filePath)}`);
			};

			try {
				const templateFile = `${functionDir}/template.yaml`
				var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));
				doc.Name = `${name}Function`
				doc.Runtime = runtime
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
