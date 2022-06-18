const yaml = require('js-yaml')
const fs   = require('fs');
const chalk = require("chalk")

module.exports = async function(path) {
	try {
		var doc =  yaml.load(fs.readFileSync(path, 'utf8'));
		return doc
	} catch (e) {
		console.log(chalk.red(`Failed to parse ${path}`))
		console.log(e.message);
		process.exit(2)
	}
}
