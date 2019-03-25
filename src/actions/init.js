'use strict';

const fs = require('fs');
const unzip = require('unzip');
const path = require('path');

module.exports = {
	init: function() {
		var scriptDir = path.dirname(require.main.filename);
		return fs.createReadStream(`${scriptDir}/data/app.zip`)
			.pipe(unzip.Extract({ path: '.' }));
	}
}