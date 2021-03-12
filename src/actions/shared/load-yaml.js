const yaml = require('js-yaml')
const fs   = require('fs');

module.exports = async function(path) {
	try {
		var doc =  yaml.load(fs.readFileSync(path, 'utf8'));
		return doc
	} catch (e) {
		return {}
	}
}
