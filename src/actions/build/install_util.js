'use strict';

const Q = require('q');
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const yaml = require('js-yaml')
const fs = require('fs-extra')
const del = require('del')
const chalk = require('chalk')

module.exports = {
  isDockerAvailable: isDockerAvailable,
  buildContainer: buildContainer,
  install: install,
  installPythonRequirements: installPythonRequirements,
  copyRequirementsToFunction: copyRequirementsToFunction
}

function isDockerAvailable() {
  const ps = spawnSync('docker',["image", "ls"], { encoding: 'utf-8' });
  if (ps.error) {
      console.log("Docker issues!");
      return false
  } else if (ps.status !== 0) {
      console.log(`Docker issues, code: ${ps.status}`)
      return false
  }
  return true
}

async function buildContainer() {
  const scriptPath = path.dirname(require.main.filename)

  var deferred = Q.defer();

  const child = spawn('docker',
    ['build', '-t', 'rocketsam', `${scriptPath}/src/actions/build`],
    { encoding: 'utf-8' })
  
  child.stdout.on('data', function(code) {
    process.stdout.write(code);
  })

  child.stderr.on('data', function(error) {
    process.stderr.write(chalk.red(error));
  })

  child.on('close', function(code) {
    deferred.resolve()
  })

  return deferred.promise
}

async function install(appDir, buildDir, functionName) {
  const templateFile = `${appDir}/${functionName}/template.yaml`  
  var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));

  console.log(doc.Runtime);

  switch(doc.Runtime) {
    case "python3.6":
      return await installPythonRequirements(appDir, buildDir, functionName)
    case "nodejs8.10":
      return await installNodeRequirements(appDir, buildDir, functionName)
  }
}

async function installPythonRequirements(appDir, buildDir, functionName) {
  await fs.mkdirSync(`${buildDir}/.requirements/${functionName}`, { recursive: true })
  await del([`${buildDir}/.requirements/${functionName}/*`]);

  const dockerCommand = ["run",
    "-v", `${appDir}:/app`,
    "-v", `${buildDir}:/build`,
    "rocketsam"
  ]

  const pipCommand = [`pip3`, `install`, `-r`,
    `/app/${functionName}/requirements.txt`,
    `-t`, `/build/.requirements/${functionName}`]

  const fullCommand = dockerCommand.concat(pipCommand)

  const run = spawnSync('docker', fullCommand,
    { encoding: 'utf-8' })

  if (run.status == 0) {
    console.log("Installed requirements successfully");
  }
  else {
    console.log(chalk.red("Failed install requirements"));
    console.log(run["stderr"]);
  }

  return run.status == 0
}

async function installNodeRequirements(appDir, buildDir, functionName) {
  await fs.mkdirSync(`${buildDir}/.requirements/${functionName}`, { recursive: true })
  await del([`${buildDir}/.requirements/${functionName}/*`]);

  const dockerCommand = ["run",
    "-v", `${appDir}:/app`,
    "-v", `${buildDir}:/build`,
    "rocketsam"
  ]
  
  const pipCommand = [`npm`, `install`, `/app/${functionName}`,
    `--prefix`, `/build/.requirements/${functionName}`]

  const fullCommand = dockerCommand.concat(pipCommand)

  const run = spawnSync('docker', fullCommand,
    { encoding: 'utf-8' })

  if (run.status == 0) {
    console.log("Installed requirements successfully");
  }
  else {
    console.log(chalk.red("Failed install requirements"));
    console.log(run["stderr"]);
  }

  return run.status == 0
}

async function copyRequirementsToFunction(buildDir, functionName) {
  const functionRequirementsFolder = `${buildDir}/.requirements/${functionName}`
  const functionBuildFolder = `${buildDir}/${functionName}`

  try {
    const requirements = fs.readdirSync(functionRequirementsFolder)
      .filter((f) => !f.startsWith("."))
    for (var i = 0; i < requirements.length; i++) {
      const dst = `${functionBuildFolder}/${requirements[i]}`
      const src =  `${functionRequirementsFolder}/${requirements[i]}`

      // It will symlink the folder files
      // and the zip will convert them to the appropriate files
      fs.symlinkSync(src, dst)
    }

  }
  catch (e) {
  }
}
