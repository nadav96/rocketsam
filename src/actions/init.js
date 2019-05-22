'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml')
const chalk = require("chalk")
const unzip = require('unzip');
const path = require('path');
var inquirer = require('inquirer');
const AWS = require("aws-sdk")


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
	
		if (bucketName == undefined || bucketName == '') {
			AWS.config.update({region: region});

			bucketName = await selectBucket(region)
		}
		
		var templateDir = `${path.dirname(require.main.filename)}/template`;

		await fs.mkdirSync(`${appDir}/app/functions`, { recursive: true })		
		await fs.mkdirSync(`${appDir}/app/resources`, { recursive: true })		
		await fs.mkdirSync(`${appDir}/app/common`, { recursive: true })		
		
		fs.writeFileSync(`${appDir}/app/functions/.gitkeep`)
		fs.writeFileSync(`${appDir}/app/resources/.gitkeep`)
		fs.writeFileSync(`${appDir}/app/common/.gitkeep`)
		
		const files = [
			{ prefix: "/app", file: "template-skeleton.yaml"},
			{ prefix: "", file: "rocketsam.yaml"},
			{ prefix: "", file: ".gitignore"},
			{ prefix: "/app", file: "env.json"},
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

		await fs.writeFileSync(rocketsamConfig, yaml.safeDump(rocketsamConfigYaml))

		console.log(chalk.green("Created rocketsam project"));
		
	}
}

async function getInput(message) {
	const answers = await inquirer.prompt({type: 'input', name: 'value', message: message})
	return answers['value']
}

async function selectBucket(region) {
	var s3 = new AWS.S3();

	const buckets = await getBucketsInRegion(s3, region)
	
	const choices = [
		new inquirer.Separator(), 
		{
			name: 'Create new',
			value: 1
		},
		new inquirer.Separator()]
		.concat(buckets)
	const answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'value',
			message: `select storage bucket:`,
			choices: choices
		}
	])

	if (answers["value"] == 1) {
		const bucketName = await createNewBucket(s3, region)
		return bucketName
	}
	else {
		return answers["value"]
	}
}

async function getBucketsInRegion(s3, region) {
	const allBuckets = await s3.listBuckets().promise()
	const bucketsInRegionPromiseArray = allBuckets["Buckets"]
		.map(bucket => isBucketInRegion(s3, bucket.Name, region))

	const result = await Promise.all(bucketsInRegionPromiseArray)
	return result.filter(bucket => bucket != undefined)
}

async function isBucketInRegion(s3, bucketName, region) {
	const result = await s3.getBucketLocation({
		Bucket: bucketName
	}).promise()
	if (result["LocationConstraint"] == region) {
		return bucketName
	}
	else {
		return undefined
	}
}

async function createNewBucket(s3, region) {
	while (true) {
		try {
			const bucketName = await getInput(`enter new bucket name (${region}):`)

			// create the bucket
			const result = await s3.createBucket({Bucket: bucketName}).promise()
			console.log(chalk.green(`Created bucket ${bucketName} in ${region}`));

			return bucketName
		}
		catch (e) {
			console.log(chalk.red(e.message))
		}
	}
}