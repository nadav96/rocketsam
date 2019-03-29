'use strict';

const fs = require('fs-extra');
const unzip = require('unzip');
const path = require('path');

const appDir = `${process.cwd()}`

module.exports = {
	init: async function() {
		var templateDir = `${path.dirname(require.main.filename)}/template`;

		await fs.mkdirSync(`${appDir}/app`, { recursive: true })

		const files = [
			{ prefix: "/app", file: "template-skeleton.yaml"},
			{ prefix: "", file: "rocketsam.yaml"},
			{ prefix: "", file: ".gitignore"},
		]
		for (var i = 0; i < files.length; i++) {
			const filePath = `${templateDir}/${files[i].file}`
			await fs.copyFileSync(filePath,
				`${appDir}${files[i].prefix}/${files[i].file}`);
		}
	}
}
