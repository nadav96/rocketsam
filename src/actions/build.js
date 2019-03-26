'use strict';

const Q = require('q');
// const fs = require('fs');
const fs = require('fs-extra')
const zipFolder = require('folder-zip-sync')
const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const yaml = require('js-yaml')
const Selector = require('node-option')
const del = require('del')
var dirsum = require('dirsum');
var chalk = require('chalk');


const appDir = `${process.cwd()}/app`
const buildDir = `${process.cwd()}/.build`

module.exports = {
	build: async function(option) {
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


		console.log("result: " + chalk.green("Done"))
	}
}

async function parseOptionResults(results) {
	for (var i = 0; i < results.length; i++) {
		const dep = await getDependencies(`${results[i]}/function.py`)
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
		var contents = fs.readFileSync(`${appDir}/${filename}`, 'utf8');

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
					dependencies = await getDependencies(files[i], dependencies)
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
		// Create the common folder structure
		const folderStructure = dependencies[i].substring(0 ,dependencies[i].lastIndexOf("/"));
		await fs.mkdirSync(`${location}/${functionName}/${folderStructure}`, { recursive: true })

		// Link the dependency
		const srcTarget = `${appDir}/${dependencies[i]}`
		const dstTarget = `${location}/${functionName}/${dependencies[i]}`
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

	await fs.mkdirSync(`${buildDir}/.hash`, { recursive: true })
	await fs.mkdirSync(functionBuildFolder, { recursive: true })
	await del([functionBuildFolder]);
	await fs.copy(`${appDir}/${functionName}`, functionBuildFolder)

	const newHash = await dirsumPromise(functionAppFolder)
	const oldHash = await getHashesFromBuildFolder(functionName)

	if (newHash.total != oldHash.total) {
		console.log(chalk.green("(y) code change"))
		if (newHash.requirements != oldHash.requirements) {
			console.log(chalk.green("(y) requirements change"))
		}

		await putHashesForFunction(functionName, newHash)

		zipFolder(functionBuildFolder, `${functionBuildFolder}.zip`, [])
	}
}

function dirsumPromise(dir) {
	var deferred = Q.defer();
	dirsum.digest(dir, 'sha1', function(err, hashes) {
		deferred.resolve({
			requirements: hashes.files["requirements.txt"],
			total: hashes.hash
		})
	})

	return deferred.promise
}

const installHashFilename = "install.txt"
const totalHashFilename = "total.txt"


async function getHashesFromBuildFolder(functionName) {
	var installHash = undefined
	var totalHash = undefined

	try {
		installHash = fs.readFileSync(`${buildDir}/.hash/${functionName}_${installHashFilename}`, 'utf8');
		totalHash = fs.readFileSync(`${buildDir}/.hash/${functionName}_${totalHashFilename}`, 'utf8');
	}
	catch (e) {
	}

	return {
		requirements: installHash,
		total: totalHash
	}
}

async function putHashesForFunction(functionName, hashes) {
	fs.writeFileSync(`${buildDir}/.hash/${functionName}_${installHashFilename}`, hashes.requirements)
	fs.writeFileSync(`${buildDir}/.hash/${functionName}_${totalHashFilename}`, hashes.total)
}
