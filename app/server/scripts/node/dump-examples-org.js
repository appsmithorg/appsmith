if (process.argv.length !== 5) {
	console.error("Takes three arguments, the MongoDB URL (like 'mongodb://localhost:27017/mobtools'),\n" +
		"\tthe encryption salt and the encryption password used by the server connecting to this DB.");
	process.exit(1);
}

const MONGODB_URL = process.argv[2];
const ENCRYPTION_SALT = process.argv[3];
const ENCRYPTION_PASSWORD = process.argv[4];

const { MongoClient, ObjectID } = require("mongodb");
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");

const mongoClient = new MongoClient(MONGODB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

console.time("total time taken");
main()
	.then(() => console.log("\nFinished Successfully."))
	.catch(error => console.error(error))
	.finally(() => {
		mongoClient.close();
		console.timeEnd("total time taken");
		console.log();
	});

async function main() {
	const con = await mongoClient.connect();
	const db = con.db();

	const pluginPackageNameByIds = {};
	for (const plugin of await db.collection("plugin").find().toArray()) {
		pluginPackageNameByIds[plugin._id.toString()] = plugin.packageName;
	}

	const templateOrganizationId = (await db.collection("config").findOne({name: "template-organization"})).config.organizationId;

	const organization = await db.collection("organization").findOne({_id: ObjectID(templateOrganizationId)});

	const $datasources = await db.collection("datasource")
		.find({organizationId: templateOrganizationId, deleted: false})
		.map(datasource => {
			const datasourceConfiguration = datasource.datasourceConfiguration;

			if (datasourceConfiguration.authentication && datasourceConfiguration.authentication.password) {
				datasourceConfiguration.authentication.password = decrypt(datasourceConfiguration.authentication.password);
			}

			return {
				name: datasource.name,
				$pluginPackageName: pluginPackageNameByIds[datasource.pluginId],
				datasourceConfiguration: datasourceConfiguration,
				invalids: datasource.invalids,
				deleted: false,
				policies: [],
				_class: datasource._class,
			};
		})
		.toArray();

	const allPageIds = [];
	const allDefaultPageIds = new Set();
	const $applications = await db.collection("application")
		.find({organizationId: templateOrganizationId, deleted: false, isPublic: true})
		.map(application => {
			allPageIds.push(...application.pages.map(page => ObjectID(page._id)));
			allDefaultPageIds.add(application.pages.filter(page => page.isDefault)[0]._id.toString());
			return {
				name: application.name,
				isPublic: true,
				$pages: [],
				pages: application.pages,
				deleted: false,
				policies: [],
				_class: application._class,
			};
		})
		.toArray();

	const actionsByPageId = {};
	for (const action of await db.collection("action").find({organizationId: templateOrganizationId, deleted: false}).toArray()) {
		if (!actionsByPageId[action.pageId]) {
			actionsByPageId[action.pageId] = [];
		}
		let $isEmbedded = typeof action.datasource._id === "undefined";
		actionsByPageId[action.pageId].push({
			name: action.name,
			datasource: {
				$isEmbedded,
				name: action.datasource.name,
				$pluginPackageName: pluginPackageNameByIds[action.datasource.pluginId],
				datasourceConfiguration: action.datasource.datasourceConfiguration,
				invalids: action.datasource.invalids,
				deleted: false,
				policies: [],
			},
			actionConfiguration: action.actionConfiguration,
			pluginType: action.pluginType,
			executeOnLoad: action.executeOnLoad,
			dynamicBindingPathList: action.dynamicBindingPathList,
			isValid: action.isValid,
			invalids: action.invalids,
			jsonPathKeys: action.jsonPathKeys,
			deleted: false,
			policies: [],
			_class: action._class,
		});
	}

	const pagesById = {};
	for (const page of await db.collection("page").find({_id: {$in: allPageIds}}).toArray()) {
		const pageId = page._id.toString();

		for (const layout of page.layouts) {
			delete layout._id;
			for (const actionSet of layout.layoutOnLoadActions) {
				for (const action of actionSet) {
					delete action._id;
				}
			}
			for (const actionSet of layout.publishedLayoutOnLoadActions) {
				for (const action of actionSet) {
					delete action._id;
				}
			}
		}

		pagesById[pageId] = {
			name: page.name,
			$isDefault: allDefaultPageIds.has(pageId),
			$actions: actionsByPageId[pageId],
			layouts: page.layouts,
			deleted: false,
			policies: [],
			_class: page._class,
		};
	}

	for (const application of $applications) {
		application.$pages = [];
		for (const page of application.pages) {
			application.$pages.push(pagesById[page._id]);
		}
		delete application.pages;
	}

	const finalData = {
		name: organization.name,
		organizationSettings: organization.organizationSettings,
		slug: organization.slug,
		userRoles: [],
		deleted: false,
		policies: [],
		_class: organization._class,
		$datasources,
		$applications,
	};

	if (finalData.slug !== "example-apps") {
		console.warn("The slug of the organization in the generated dump is not `example-apps`. This might be significant.");
	}

	fs.writeFileSync(
		findExamplesJsonPath(),
		JSON.stringify(finalData, null, 2)
	);
}

function findExamplesJsonPath() {
	let projectDir = __dirname;

	while (projectDir !== null && !fs.existsSync(path.join(projectDir, "appsmith-server"))) {
		projectDir = path.dirname(projectDir);
	}

	return path.join(projectDir, "appsmith-server", "src", "main", "resources", "examples-organization.json");
}


/*!
* Author: flohall
* date: 2019-11-05
* file: module/textEncryptor.js
* Original: <https://stackoverflow.com/a/58720652/151048>.
*/
const key = CryptoJS.PBKDF2(ENCRYPTION_PASSWORD, ENCRYPTION_SALT, {
	keySize: 256 / 32,
	iterations: 1024
});

const decryptConfig = {
	// same as NULL_IV_GENERATOR of AesBytesEncryptor - so encryption creates always same cipher text for same input
	iv: {words: [0, 0, 0, 0, 0, 0, 0, 0], sigBytes: 0},
	padding: CryptoJS.pad.Pkcs7,
	mode: CryptoJS.mode.CBC
};

function decrypt(text) {
	return CryptoJS.AES
		.decrypt({ciphertext: CryptoJS.enc.Hex.parse(text)}, key, decryptConfig)
		.toString(CryptoJS.enc.Utf8);
}
