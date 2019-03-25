'use strict';
const meow = require('meow');
module.exports = {
	getCli: function() {
		return meow(`hello world`, {
			flags: {
				rainbow: {
					type: 'boolean',
					alias: 'r'
				},
				example: {
					type: 'string',
					alias: 'e',
					default: "hello-wrold"
				}
			}
		})
	}

}