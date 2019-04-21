'use strict';

const fs = require('fs-extra')
const dirsum = require('dirsum');
const Q = require('q');
var chalk = require('chalk');
const path = require('path')
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

const installHashFilename = "install.txt"
const totalHashFilename = "total.txt"

module.exports = {
  calculateHashForDirectoy: dirsumPromise,
  getHashesFromBuildFolder: getHashesFromBuildFolder,
  putHashesForFunction: putHashesForFunction
}

function dirsumPromise(dir) {
	var deferred = Q.defer();
	dirsum.digest(dir, 'sha1', function(err, hashes) {
		var requirementsHash = undefined
		if (hashes && hashes["files"] != undefined) {
			requirementsHash = hashes["files"]["requirements.txt"]
			if(requirementsHash == undefined) {
				requirementsHash = hashes["files"]["package.json"]
			}
		}
		deferred.resolve({
			requirements: requirementsHash,
			total: hashes.hash
		})
	})

	return deferred.promise
}

async function getHashesFromBuildFolder(buildDir, functionName) {
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

async function putHashesForFunction(buildDir, functionName, hashes) {
	fs.writeFileSync(`${buildDir}/.hash/${functionName}_${installHashFilename}`, hashes.requirements)
	fs.writeFileSync(`${buildDir}/.hash/${functionName}_${totalHashFilename}`, hashes.total)
}
