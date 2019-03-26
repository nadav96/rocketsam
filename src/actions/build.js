'use strict';

const Q = require('q');
const fs = require('fs');
const zipFolder = require('folder-zip-sync')
const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const yaml = require('js-yaml')
const Selector = require('node-option')
const del = require('del')
var dirsum = require('dirsum');
var ncp = require('ncp').ncp


const appDir = `${process.cwd()}/app`
const buildDir = `${process.cwd()}/.build`

module.exports = {
	build: async function(option) {
		const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory() && f != "common")

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
			dirs(appDir).forEach(function(dir) {
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
		await parseOptionResults(result)

		console.log("Done")
	}
}

async function parseOptionResults(results) {
	for (var i = 0; i < results.length; i++) {
		if (results[i] == 1) {
			// todo: implement caching validation in the common folder
		}
		else {
			const dep = await getDependencies(`${results[i]}/function.py`)
			dep.shift()

			console.log(`${results[i]}: ${dep.length} dependencies`)

			await populateFunctionCommonFolder(results[i], dep)

			await functionBuildFolder(results[i], [])
		}
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
	await fs.mkdirSync(functionBuildFolder, { recursive: true })
	await ncpPromise(`${appDir}/${functionName}`, functionBuildFolder)

	const hash = await dirsumPromise(functionBuildFolder)
	console.log(hash)

	zipFolder(functionBuildFolder, `${functionBuildFolder}.zip`, [])
}

function ncpPromise(source, dst) {
	var deferred = Q.defer();

	ncp(source, dst, 
		function (err) {
			if (err) {
				return console.error(err);
			}

			deferred.resolve()
		});

	return deferred.promise;
}

function dirsumPromise(dir) {
	var deferred = Q.defer();

	dirsum.digest(dir, 'sha1', function(err, hashes) {
		deferred.resolve(hashes.hash)
	})

	return deferred.promise
}