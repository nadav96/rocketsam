'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml')
const chalk = require("chalk")
const unzip = require('unzip');
const path = require('path');

const appDir = `${process.cwd()}`

module.exports = {
	init: async function(cli) {
		const bucketName = cli.flags["bucket"]
		const stackName = cli.flags["stack"]

		if (bucketName == undefined || bucketName == '') {
			console.log(chalk.red("Missing bucket name param that will be used for storage"));
			return
		}
		if (stackName == undefined || stackName == '') {
			console.log(chalk.red("Missing stack name for the CloudFormation deployment"));
			return
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

		fs.writeFileSync(rocketsamConfig, yaml.safeDump(rocketsamConfigYaml))
	}
}
