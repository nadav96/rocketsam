'use strict';

const Q = require('q');
const fs = require('fs-extra')
const zipFolder = require('folder-zip-sync')
const { readdirSync, statSync } = require('fs-extra')
const { join } = require('path')
const path = require('path')
const yaml = require('js-yaml')
const Selector = require('node-option')
const del = require('del')
var dirsum = require('dirsum');
var chalk = require('chalk');
var installUtil = require('./build/install_util')
var envBuilder = require('./build/env_type')
var templateCreation = require(`./template`)
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)


var appDir = undefined
var buildDir = undefined
var commonDir = undefined

module.exports = {
	build: async function(option) {
		const settings = await settingsParser()
		if (settings != undefined) {
				appDir = settings.appDir
				buildDir = settings.buildDir
				commonDir = settings.commonDir
		}
		else {
			console.log(chalk.red("Project not configured, aborting build"));
			return
		}		

		const dirsFunction = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory())

		const dirs = dirsFunction(`${appDir}/functions`)

		var result = []
		if (option == undefined) {
			const selector = new Selector({
			  markWrapperColor: 'white',
			  checkedMarkColor: 'white',
			  textColor: 'yellow',
			  multiselect: true,
			});

			console.log("Choose which function to build")

			selector.add("build all (with cache)", 1)

			dirs.forEach(function(dir) {
				selector.add(dir)
			});
			result = await selector.render()
		}
		else {
			if (option == "all") {
				result = [1]
			}
			else {
				result = [option]
			}
		}
		if (result.includes(1)) {
			await parseOptionResults(dirs)
		}
		else {
			await parseOptionResults(result)
		}

		console.log(chalk.yellow("\ntemplate:"));
		
		await templateCreation.createTemplate()		
	}
}

async function parseOptionResults(results) {
	await installUtil.buildContainer()

	for (var i = 0; i < results.length; i++) {
		var functionFilePath = `${appDir}/functions/${results[i]}`
		if (fs.existsSync(`${functionFilePath}/function.py`)) {
			functionFilePath += "/function.py"
		}
		else if (fs.existsSync(`${functionFilePath}/function.js`)) {
			functionFilePath += "/function.js"
		}
		const dep = await getDependencies(functionFilePath)
		dep.shift()

		console.log(chalk.yellow(`${results[i]}:`) + chalk.bold(` ${dep.length}`) + ` common dependencies`)

		await populateFunctionCommonFolder(results[i], dep)

		await envBuilder.buildEnvFile(results[i])

		await functionBuildFolder(results[i], [])		
	};
}

async function getDependencies(filename, dependencies = []) {
	if (filename == "") {
		return dependencies
	}
	try {
		var contents = fs.readFileSync(filename, 'utf8');

		// After location the dependency file was found
		dependencies.push(filename)


		const firstLineEnd = contents.indexOf('\n')
		if (firstLineEnd > -1) {
			const diLine = contents.slice(0, firstLineEnd)
			if (diLine[0] != "#") {
				return dependencies
			}

			const diStartLocation = contents.indexOf("DI:")
			if (diStartLocation == -1) {
				return dependencies
			}

			// DI found
			const files = diLine.slice(diStartLocation + 3).split(" ")
			for (var i = 0; i < files.length; i++) {
				if (!dependencies.includes(files[i])) {
					if (files[i] != "") {

						dependencies = await getDependencies(`${commonDir}/${files[i]}`, dependencies)
					}
				}
			}
		}
	} catch (err) {
		console.error(`missing dependency ${filename}`)
	}

	return dependencies
}

async function populateFunctionCommonFolder(functionName, dependencies, location=appDir, commonSymlinks=true) {
	// Delete the previous function common folder

	await del([`${location}/functions/${functionName}/common`]);

	for (var i = 0; i < dependencies.length; i++) {
		const dependencyFilename = dependencies[i].split(`${commonDir}/`)[1]

		// Create the common folder structure
		const folderStructure = "common/" + path.dirname(dependencyFilename);
		await fs.mkdirsSync(`${location}/functions/${functionName}/${folderStructure}`)

		// Link the dependency
		const srcTarget = `${dependencies[i]}`
		const dstTarget = `${location}/functions/${functionName}/common/${dependencyFilename}`
		if (commonSymlinks) {
			try {
				await fs.symlinkSync(srcTarget, dstTarget)
			}
			catch (e) {

			}
		}
		else {
			await fs.copyFileSync(srcTarget, dstTarget);
		}
	}
}

async function functionBuildFolder(functionName, dependencies) {
	const functionBuildFolder = `${buildDir}/functions/${functionName}`
	const functionAppFolder = `${appDir}/functions/${functionName}`

	// Creates if not exists the build folder
	//alongside the sub directories .hash and the function folder
	await fs.mkdirsSync(`${buildDir}/.hash`)
	await fs.mkdirsSync(functionBuildFolder)
	// Delete the previous created build folder
	await del([functionBuildFolder]);
	// Copy the function app folder to the build folder
	await fs.copy(`${appDir}/functions/${functionName}`, functionBuildFolder)

	// Delete the template folder in the function build folder
	await del([`${functionBuildFolder}/template.yaml`])
	await del([`${functionBuildFolder}/event.json`])
	await del([`${functionBuildFolder}/env.json`])

	// copy the old function requirements folder is exists
	installUtil.copyRequirementsToFunction(buildDir, functionName)

	const hashUtil = require("./build/hash_util.js")

	var newHash = await hashUtil.calculateHashForDirectoy(functionBuildFolder)
	const oldHash = await hashUtil.getHashesFromBuildFolder(buildDir, functionName)

	var installResult = true

	if (newHash.total != oldHash.total) {
		console.log(chalk.green("(m) code"))
		if (newHash.requirements != oldHash.requirements) {
			console.log(chalk.green("(m) requirements"))

			installResult = await installUtil.install(appDir, buildDir, functionName)
			installUtil.copyRequirementsToFunction(buildDir, functionName)

			newHash = await hashUtil.calculateHashForDirectoy(functionBuildFolder)
		}

		if (installResult) {
			await zipFolder(functionBuildFolder, `${functionBuildFolder}.zip`, [])
			await hashUtil.putHashesForFunction(buildDir, functionName, newHash)
		}
	}
	else {
		console.log(chalk.blueBright("(#) no changes detected"));
	}
}
