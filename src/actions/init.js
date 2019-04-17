'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml')
const chalk = require("chalk")
const unzip = require('unzip');
const path = require('path');
var inquirer = require('inquirer');

const appDir = `${process.cwd()}`

const regions = [
	"eu-north-1",
	"ap-south-1",
	"eu-west-3",
	"eu-west-2",
	"eu-west-1",
	"ap-northeast-2",
	"ap-northeast-1",
	"sa-east-1",
	"ca-central-1",
	"ap-southeast-1",
	"ap-southeast-2",
	"eu-central-1",
	"us-east-1",
	"us-east-2",
	"us-west-1",
	"us-west-2"
]

module.exports = {
	init: async function(cli) {
		var bucketName = cli.flags["bucket"]
		var stackName = cli.flags["stack"]
		var region = cli.flags["region"]

		if (bucketName == undefined || bucketName == '') {
			bucketName = await getInput("enter storage bucket name:")
		}
		if (stackName == undefined || stackName == '') {
			stackName = await getInput("enter stack name:")
		}
		if (!regions.includes(region)) {
			const answers = await inquirer.prompt([
			  {
				type: 'list',
				name: 'value',
				message: 'select region:',
				choices: regions
			  }
			])
			region = answers['value']
		}

		var templateDir = `${path.dirname(require.main.filename)}/template`;

		await fs.mkdirSync(`${appDir}/app`, { recursive: true })

		const files = [
			{ prefix: "/app", file: "template-skeleton.yaml"},
			{ prefix: "", file: "rocketsam.yaml"},
			{ prefix: "", file: ".gitignore"},
		]
		for (var i = 0; i < files.length; i++) {
			const filePath = `${templateDir}/${files[i].file}`
			try {
				await fs.copyFileSync(filePath,
					`${appDir}${files[i].prefix}/${files[i].file}`, [fs.constants.COPYFILE_EXCL]);
			}
			catch (e) {
				console.log(`${files[i].file} already exists`);
			}
		}

		const rocketsamConfig = `${appDir}${files[1].prefix}/${files[1].file}`
		var rocketsamConfigYaml = yaml.safeLoad(fs.readFileSync(rocketsamConfig, 'utf8'));

		rocketsamConfigYaml["storageBucketName"] = bucketName
		rocketsamConfigYaml["stackName"] = stackName
		rocketsamConfigYaml["region"] = region

		fs.writeFileSync(rocketsamConfig, yaml.safeDump(rocketsamConfigYaml))
	}
}

async function getInput(message) {
	const answers = await inquirer.prompt({type: 'input', name: 'value', message: message})
	return answers['value']
}