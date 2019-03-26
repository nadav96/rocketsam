'use strict';

const fs = require('fs');
const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const appDir = `${process.cwd()}/app`
const chalk = require("chalk")
const yaml = require('js-yaml')

module.exports = {
	status: async function() {
		const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory() && f != "common")
		dirs(appDir).forEach(function(dir) {
			console.log(chalk.green.bold("F: ") + chalk.green(dir))

			const templateFile = `${appDir}/${dir}/template.yaml`
			var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));
			if (doc.IsApi) {
				const isApiStatus = chalk.yellow(doc.Events.Main.Properties.Path)
				console.log("Api: " + isApiStatus)
			}
			console.log()
		})
	}
}