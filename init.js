'use strict';

const fs = require('fs');
const unzip = require('unzip');

module.exports = {
	init: function() {
		return fs.createReadStream(`${__dirname}/data/app.zip`)
			.pipe(unzip.Extract({ path: '.' }));
	}
}