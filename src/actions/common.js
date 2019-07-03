'use strict';

const Q = require('q');
const fs = require('fs-extra')
const yaml = require('js-yaml');
var chalk = require('chalk');
const path = require('path')
const meow = require('meow');
var glob = require("glob")
var settingsParser = require(`${path.dirname(require.main.filename)}/src/settings.js`)

var appDir = undefined
var buildDir = undefined

module.exports = {
    common: async function() {
        const cli = getCli()
        const settings = await settingsParser()
		if (settings != undefined) {
        appDir = settings.appDir
        buildDir = settings.buildDir
		}
		else {
			console.log(chalk.red("Project not configured, aborting add"));
			return
        }
        
        switch (cli.input[1]) {
            case "action":
                action()
                break
            default:
                console.log(chalk.red(`incorrect syntax: ${cli.input[1]}`));
                console.log("rocketsam common action");
                break
        }
    }
}

function getCli() {
	return meow('', {
	})
}

async function action() {
    const files = glob.sync(`${appDir}/common/**/*`, {
        nodir: true
    })

    files.forEach(file => actionForFile(file));
}

async function actionForFile(file) {
    var contents = fs.readFileSync(file, 'utf8');

    const firstLineEnd = contents.indexOf('\n')
    if (firstLineEnd > -1) {
        const diLine = contents.slice(0, firstLineEnd)
        if (diLine[0] != "#") {
            return
        }

        const diStartLocation = contents.indexOf("ACTION:")
        if (diStartLocation == -1) {
            return
        }

        const action = diLine.slice(diStartLocation + 7).replace(" ", "")
        
        switch(action) {
            case "DELETE": 
                console.log(chalk.red("DELETE:"), path.basename(file));
                fs.unlinkSync(file)
                break
            default:
                break
                
        
        }
        return
        // ACTION found
        const files = diLine.slice(diStartLocation + 3).split(" ")
        for (var i = 0; i < files.length; i++) {
            if (!dependencies.includes(files[i])) {
                if (files[i] != "") {

                    dependencies = await getDependencies(`${commonDir}/${files[i]}`, dependencies, populate)
                }
            }
        }
    }
}