# Rocketsam

A CLI made to build and deploy microservices in AWS (extending AWS SAM).

Currently the project supports lambda written in python 3.6, but can easily be extended to support more languages.

## Why Rocketsam?
Good question, even though there are many third party solution for deploying and building microservices on AWS, I found that they all lack some feature or another.

### Advantages of Rocketsam
* Template per function instead of gigantic template file (the CLI will append to the app skeleton each of the functions template)
* Caching per function, this CLI will upload only functions that their build output has changed (using hash validation).
* the robust build command, which allowes building specific functions, and it will build only when changes are detected.
* The build command support python dependencies (it will be installed using docker).
* Seamless deployment of the microservice using Cloud Formation.
* Easy access to API url's and logs of each function using **logs** and **outputs** commands.
* Running a local version of the server using SAM local.

For more info, run rocketsam help

## Getting Started

```
npm install -g rocketsam
```

### Prerequisites

In order to use the CLI, one must install [AWS SAM](https://aws.amazon.com/serverless/sam/), as well as [Docker](https://www.docker.com/) (in order to spin a local server and to install dependencies)

### Folder structure
![Folder structure](./img/structure.png)

1. The build folder, contains all of the app's auto generated data
2. the CLI uses the hash folder to detect changes in the code, removing this folder will force rebuilding of the entire microservice.
3. hash of the function 'hello' dependencies
4. hash of the function 'hello' code
5. the Cloud Formation template created by SAM
6. This folder contains all of the functions requirements installed via pip
7. the function 'hello' requirements.
8. the function 'hello' output dir before zipping (contains symlinks to relevant requirements and common folders).
9. the function complete zip (with requirements and everything), the template will use this file as the function code to deploy to AWS.
10. The app code, contains the skeleton template and all of the functions code.
11. The function folder 'hello'
12. The function 'hello' code itself
13. The function requirements file (will install dependencies from here)
14. the function template file, details below
15. the skeleton template, will be copied to the build folder and each function template will be appended to it.
16. The rocketsam config file, details below

## The function template file
...

## The Rocketsam config file
...

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details