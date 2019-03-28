'use strict';
const meow = require('meow');
module.exports = {
	getCli: function() {
		return meow(`hello world`, {
			flags: {
			}
		})
	}

}
