'use strict';

const chalk = require("chalk")

exports.help = function () {
  console.log("Welcome to " + chalk.bold("RocketSam"));
  console.log("An eco system for creating and deploying AWS sam serverless projects");
  console.log("Copyrights to Nadav Goldstein")
  console.log();
  console.log(chalk.bold("* Usage"));
  printCommandHelp("$ rocketsam init", "initialize the rocketsam project")
  console.log(chalk.bold("-b | --bucket") + " (optional) - the storage bucket name, must be in the same region as the microservice!");
  console.log(chalk.bold("-s | --stack") + " (optional) - the stack name");
  console.log(chalk.bold("-r | --region") + " (optional) - the microservice region");

  console.log();

  printCommandHelp("$ rocketsam create {1}", `Creates a new lambda function in the project (a simple folder)`)
  console.log(chalk.bold("{1}") + " (*) - the name of the lambda function (aka the folder name)");
  console.log();
  

  printCommandHelp("$ rocketsam add bucket {1}", `this command will add a bucket to the existing microservice`)  
  console.log(chalk.bold("{1}") + " (*) - the name of the bucket");
  console.log();

  printCommandHelp("$ rocketsam add event {1} {2}", `this command will add an event to a lambda function supplied. api - will be called when a specific api endpoint is called. bucket - will be called when in the created bucket object is uploaded`)
  console.log(chalk.bold("The event is added as a property in the function template! SammyApiEvent|SammyBucketEvent"));
  console.log(chalk.bold("{1}") + " (*) - the type of event (api|bucket)");
  console.log(chalk.bold("{2}") + " (*) - the function name");
  console.log(chalk.bold("-e | --endpoint") + " (optional) - if api event, this will be the endpoint, if not set, the endpoint will consist of the function name");
  
  console.log("e: $ rocketsam add event api demo --endpoint /user/list");
  console.log("e: $ rocketsam add event bucket demo");
  console.log();
  
  
  printCommandHelp("$ rocketsam build {1}", `a command which builds one of the functions (or multiple), which includes zipping the function, installing python requirements and caching both`)
  console.log(chalk.bold("{1}") + " (optional) - name of the function to build, if 'all' is entered the command will build all of the functions ");
  console.log();

  printCommandHelp("$ rocketsam template", "this command merge the skeleton template with each of the functions template into one big template file ready for deployment")
  console.log();
  
  printCommandHelp("$ rocketsam deploy", `After building all functions, and running the template command, deploy the project using the deploy function, which simply calles sam package, and CloudFormation deploy stack`)
  console.log();

  printCommandHelp("$ rocketsam outputs", `This command will return the stack outputs (rocketsam automatically add functions api url to it)`)
  console.log();

  printCommandHelp("$ rocketsam logs {1}", `This command tails after the given function logs in cloud watch in the last 5 minutes, and prints new logs as they arrive`)
  console.log(chalk.bold("{1}") + " (*) - the function name");
  console.log();

  printCommandHelp("$ rocketsam invoke {1}", `This command using sam CLI invokes the function in a similar env to prod (using docker). project must be built beforehand`)
  console.log(chalk.bold("{1}") + " (*) - the function name");
  console.log();
  
  printCommandHelp("$ rocketsam local", `This command spawn sam local api using docket (must build and template the project beforehand)`)
  console.log();

  printCommandHelp("$ rocketsam remove", `This will remove the stack from aws`)
  console.log();

  printCommandHelp("$ rocketsam status", `Shows the lambda functions that currently exist in the project`)
  console.log();
};

function printCommandHelp(title, description) {
  console.log(chalk.yellow(title));
  console.log(description);
}
