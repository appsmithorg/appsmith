import nodePlop, {AddManyActionConfig} from './index';

const plop = nodePlop('./file', {
	destBasePath: './',
	force: false,
});

const generators = plop.getGeneratorList();

const names = generators.map((v) => v.name);

const generator = plop.getGenerator(names[0]);

plop.getWelcomeMessage();

// $ExpectError
plop.test();

generator.runPrompts(['test']).then((answers) => {
	const onComment = (): void => {
		console.log('Start');
	};
	const onSuccess = (): void => {
		console.log('This worked!');
	};
	const onFailure = (): void => {
		console.log('Failed');
	};
	return generator.runActions(answers, { onSuccess, onFailure, onComment }).then(() => {
		console.log('Done');
	});
});

plop.setGenerator('test', {
	description: "test generator",
	prompts: [{
		type: 'input',
		name: 'name',
		message() {
			return 'test name';
		},
		validate(value) {
			if ((/.+/).test(value)) { return true; }
			return 'test name is required';
		}
	}],
	actions: [{
		type: 'add',
		path: 'tests/{{dashCase name}}.ava.js',
		templateFile: 'plop-templates/ava-test.js'
	}]
});

plop.setGenerator('test-dynamic-prompts-only', {
	description: "test dynamic prompts only",
	prompts: async (inquirer) => ({
		name: "something-dynamic"
	}),
	actions: [{
		type: 'add',
		path: 'tests/{{dashCase name}}.ava.js',
		templateFile: 'plop-templates/ava-test.js'
	}]
});


plop.setGenerator('test-dynamic-actions-only', {
	description: "test dynamic actions only",
	prompts: [{
		type: 'input',
		name: 'name',
		message() {
			return 'test name';
		},
		validate(value) {
			if ((/.+/).test(value)) { return true; }
			return 'test name is required';
		}
	}],
	actions(data) {
		return [{
			type: 'add',
			path: 'tests/{{dashCase name}}.ava.js',
			templateFile: 'plop-templates/ava-test.js',
		}];
	}
});

plop.setGenerator("test-dynamic-prompts-and-actions", {
	description: "Uses dynamic prompts and actions",
	async prompts(inquirer) {
		return {
			name: "something-dynamic"
		}
	},
	actions(data) {
		return [{
			type: 'add',
			path: 'tests/{{dashCase name}}.ava.js',
			templateFile: 'plop-templates/ava-test.js',
		}];
	}
})

const useAddManyAction = (): AddManyActionConfig => ({
	type: 'addMany',
	base: '',
	templateFiles: '',
	path: '',
	destination: '',
	stripExtensions: ['hbs'],
	globOptions: {
		dot: true
	},
});

const useAddManyTransformAction = (): AddManyActionConfig => ({
	type: 'addMany',
	base: '',
	templateFiles: '',
	path: '',
	destination: '',
	stripExtensions: ['hbs'],
	transform: () => 'hello',
	globOptions: {
		dot: true
	},
});
