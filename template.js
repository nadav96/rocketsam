'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const Selector = require('node-option');

module.exports = {
	build: function() {
		const selector = new Selector({
		  markWrapperColor: 'white',
		  checkedMarkColor: 'white',
		  textColor: 'yellow',
		  multiselect: true,
		});

		const result = selector
		                .add('One')
		                .add('Two')
		                .add('Three')
		                .add('Four')
		                .render();

		result.then((value) => {
		  console.log(value);
		}, (error) => {
		  console.log(error);
		});
	}
}