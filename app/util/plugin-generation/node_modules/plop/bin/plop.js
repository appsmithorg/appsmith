#!/usr/bin/env node
const args = process.argv.slice(2);
const {Plop, run} = require('../src/plop');
const argv = require('minimist')(args);

Plop.launch({
	cwd: argv.cwd,
	configPath: argv.plopfile,
	require: argv.require,
	completion: argv.completion
}, run);