'use strict';

const chalk = require("chalk")

exports.help = function () {
  console.log("Welcome to " + chalk.bold("RocketSam"));
  console.log("An eco system for creating and deploying AWS sam serverless projects");
  console.log("Copyrights to Nadav Goldstein")
  console.log();
  console.log(chalk.bold("* Usage"));
  printCommandHelp("$ rocketsam init", "initialize the rocketsam project")
  console.log();

  printCommandHelp("$ rocketsam build {1}", `a command which builds one of the functions (or multiple), which includes zipping the function, installing python requirements and caching both`)
  console.log(chalk.bold("{1}") + " (optional) - name of the function to build, if 'all' is entered the command will build all of the functions ");
  console.log();

  printCommandHelp("$ rocketsam template", "this command merge the skeleton template with each of the functions template into one big template file ready for deployment")

};

function printCommandHelp(title, description) {
  console.log(chalk.yellow(title));
  console.log(description);
}
