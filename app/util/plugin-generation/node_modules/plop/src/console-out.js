'use strict';

const chalk = require('chalk');
const nodePlop = require('node-plop');
const fs = require('fs');

const defaultChoosingMessage = chalk.blue('[PLOP]') + ' Please choose a generator.';

module.exports = (function () {

	function getHelpMessage(generator) {
		const maxLen = Math.max(...generator.prompts.map(prompt => prompt.name.length));
		console.log([
			'',
			chalk.bold('Options:'),
			...generator.prompts.map(prompt =>
				'  --' + prompt.name +
				' '.repeat(maxLen - prompt.name.length + 2) +
				chalk.dim(prompt.help ? prompt.help : prompt.message)
			)
		].join('\n'));
	}

	function chooseOptionFromList(plopList, message) {
		const plop = nodePlop();
		const generator = plop.setGenerator('choose', {
			prompts: [{
				type: 'list',
				name: 'generator',
				message: message || defaultChoosingMessage,
				choices: plopList.map(function (p) {
					return {
						name: p.name + chalk.gray(!!p.description ? ' - ' + p.description : ''),
						value: p.name
					};
				})
			}]
		});
		return generator.runPrompts().then(results => results.generator);
	}

	function displayHelpScreen() {
		console.log([
			'',
			chalk.bold('Usage:'),
			'  $ plop                 ' + chalk.dim('Select from a list of available generators'),
			'  $ plop <name>          ' + chalk.dim('Run a generator registered under that name'),
			'  $ plop <name> [input]  ' + chalk.dim('Run the generator with input data to bypass prompts'),
			'',
			chalk.bold('Options:'),
			'  -h, --help             ' + chalk.dim('Show this help display'),
			'  -t, --show-type-names  ' + chalk.dim('Show type names instead of abbreviations'),
			'  -i, --init             ' + chalk.dim('Generate a basic plopfile.js'),
			'  -v, --version          ' + chalk.dim('Print current version'),
			'  -f, --force            ' + chalk.dim('Run the generator forcefully'),
			'',
			chalk.dim(' ------------------------------------------------------'),
			chalk.dim('  ⚠  danger waits for those who venture below the line'),
			'',
			chalk.dim('  --plopfile             Path to the plopfile'),
			chalk.dim('  --cwd                  Directory from which relative paths are calculated against while locating the plopfile'),
			chalk.dim('  --require              String or array of modules to require before running plop'),
			chalk.dim('  --dest                 Output to this directory instead of the plopfile\'s parent directory'),
			'',
			chalk.bold('Examples:'),
			'  $ ' + chalk.blue('plop'),
			'  $ ' + chalk.blue('plop component'),
			'  $ ' + chalk.blue('plop component "name of component"'),
			'',
		].join('\n'));
	}

	function createInitPlopfile(force = false){
		var initString = 'module.exports = function (plop) {\n\n' +
			'\tplop.setGenerator(\'basics\', {\n' +
			'\t\tdescription: \'this is a skeleton plopfile\',\n' +
			'\t\tprompts: [],\n' +
			'\t\tactions: []\n' +
			'\t});\n\n' +
			'};';

		if (fs.existsSync(process.cwd() + '/plopfile.js') && force === false) {
			throw Error('"plopfile.js" already exists at this location.');
		}

		fs.writeFileSync(process.cwd() + '/plopfile.js', initString);
	}

	const typeDisplay = {
		'function': chalk.yellow('->'),
		'add': chalk.green('++'),
		'addMany': chalk.green('+!'),
		'modify': `${chalk.green('+')}${chalk.red('-')}`,
		'append': chalk.green('_+'),
		'skip': chalk.green('--')
	};
	const typeMap = (name, noMap) => {
		const dimType = chalk.dim(name);
		return (noMap ? dimType : typeDisplay[name] || dimType);
	};

	return {
		chooseOptionFromList,
		displayHelpScreen,
		createInitPlopfile,
		typeMap,
		getHelpMessage
	};
})();
