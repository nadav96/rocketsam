'use strict';

const fs = require('fs');
const unzip = require('unzip');
const yaml = require('js-yaml');

const appDir = `${process.cwd()}/app`

module.exports = {
	create: async function(name) {
		if (name) {
			await fs.mkdirSync(`${appDir}/${name}`, { recursive: true })

			const files = ["function.py", "requirements.txt", "template.yaml"]
			for (var i = 0; i < files.length; i++) {
				const filePath = `${__dirname}/data/function/${files[i]}`
				await fs.copyFileSync(filePath, `${appDir}/${name}/${files[i]}`);	
			};

		try {
			const templateFile = `${appDir}/${name}/template.yaml`
		  var doc = yaml.safeLoad(fs.readFileSync(templateFile, 'utf8'));
		  doc.Name = `${name}Function`
		  doc.Events.Main.Properties.Path = `/${name}`

		  fs.writeFileSync(templateFile, yaml.safeDump(doc))
		} catch (e) {
		  console.log(e);
		}
			
		}
		else {
			console.log("Invalid function name supplied")
		}

		// return fs.createReadStream(`${__dirname}/app.zip`)
			// .pipe(unzip.Extract({ path: '.' }));
	}
}