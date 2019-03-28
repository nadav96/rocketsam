'use strict';

const fs = require('fs-extra');
const unzip = require('unzip');
const path = require('path');

const appDir = `${process.cwd()}/app`

module.exports = {
	init: async function() {
		var templateDir = `${path.dirname(require.main.filename)}/template`;

		await fs.mkdirSync(`${appDir}`, { recursive: true })

		const files = ["template-skeleton.yaml", ".gitignore"]
		for (var i = 0; i < files.length; i++) {
			const filePath = `${templateDir}/${files[i]}`
			await fs.copyFileSync(filePath, `${appDir}/${files[i]}`);
		}
	}
}
