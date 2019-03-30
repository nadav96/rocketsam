'use strict';
const meow = require('meow');
const chalk = require('chalk')
module.exports = {
	getCli: function() {
		return meow(``, {
			flags: {
			}
		})
	}

}
