'use strict';

const fs = require('fs-extra')
const dirsum = require('dirsum');
const Q = require('q');


const appDir = `${process.cwd()}/app`
const buildDir = `${process.cwd()}/.build`
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
		deferred.resolve({
			requirements: hashes.files["requirements.txt"],
			total: hashes.hash
		})
	})

	return deferred.promise
}

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
