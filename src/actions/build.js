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

		const dirsFunction = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory() && f != "common")

		const dirs = dirsFunction(appDir)

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
	}
}

async function parseOptionResults(results) {
	for (var i = 0; i < results.length; i++) {
		const dep = await getDependencies(`${appDir}/${results[i]}/function.py`)
		dep.shift()

		console.log(chalk.yellow(`${results[i]}:`) + chalk.bold(` ${dep.length}`) + ` common dependencies`)

		await populateFunctionCommonFolder(results[i], dep)

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

	await del([`${location}/${functionName}/common`]);

	for (var i = 0; i < dependencies.length; i++) {
		const dependencyFilename = dependencies[i].split(`${commonDir}/`)[1]

		// Create the common folder structure
		const folderStructure = "common/" + path.dirname(dependencyFilename);
		await fs.mkdirSync(`${location}/${functionName}/${folderStructure}`, { recursive: true })

		// Link the dependency
		const srcTarget = `${dependencies[i]}`
		const dstTarget = `${location}/${functionName}/common/${dependencyFilename}`
		if (commonSymlinks) {
			await fs.symlinkSync(srcTarget, dstTarget)
		}
		else {
			await fs.copyFileSync(srcTarget, dstTarget);
		}
	}
}

async function functionBuildFolder(functionName, dependencies) {
	const functionBuildFolder = `${buildDir}/${functionName}`
	const functionAppFolder = `${appDir}/${functionName}`

	// Creates if not exists the build folder
	//alongside the sub directories .hash and the function folder
	await fs.mkdirSync(`${buildDir}/.hash`, { recursive: true })
	await fs.mkdirSync(functionBuildFolder, { recursive: true })
	// Delete the previous created build folder
	await del([functionBuildFolder]);
	// Copy the function app folder to the build folder
	await fs.copy(`${appDir}/${functionName}`, functionBuildFolder)

	// Delete the template folder in the function build folder
	await del([`${functionBuildFolder}/template.yaml`])

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

			installResult = await installUtil
				.installPythonRequirements(appDir, buildDir , functionName)
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
