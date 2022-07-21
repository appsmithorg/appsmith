if (process.argv.length !== 4) {
	console.error("Takes two arguments, the API URL (like 'https://localhost/api/v1/')" +
		" and the MongoDB URL (like 'mongodb://localhost:27017/mobtools').");
	process.exit(1);
}

const [API_URL, MONGODB_URL] = process.argv.slice(2);

const SUPER_EMAIL = "superuser_acl@appsmith.com";
const SUPER_PASSWORD = "migration";


const axios = require("axios");
const https = require("https");
const tough = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const { MongoClient, ObjectID } = require("mongodb");


const mongoClient = new MongoClient(MONGODB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

axiosCookieJarSupport(axios);


console.time("total time taken");
migrate()
	.then(() => console.log("Finished Successfully."))
	.catch(error => console.error(error))
	.finally(() => {
		mongoClient.close();
		console.timeEnd("total time taken");
		console.log();
	});


async function migrate() {
	const ax = axios.create({
		baseURL: API_URL,

		headers: {
			"content-type": "application/json",
			"origin": API_URL.match(/^\w+:\/\/[^/]+/)[0],  // Match just the protocol, host and port in the URL.
		},

		// This is for the Authorization header, for applying basic auth.
		auth: {
			username: "api_user",
			password: "8uA@;&mB:cnvN~{#",
		},

		// Keep session over multiple requests.
		withCredentials: true,
		jar: new tough.CookieJar(),

		// This is needed so Axios won't yell at self-signed certificates.
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
	});

	const con = await mongoClient.connect();
	const db = con.db();

	await run("Deleting super user from the database, if exists from a previous failed run.", purgeSuperUser, db, true);

	await run("Signing up using API.", signUpSuperUser, ax);

	await run("Logging in using API.", loginSuperUser, ax);

	await run("Inserting super permissions in the database.", addSuperPermissions, db);

	await run("Adding user own profile permissions in the database.", addSelfPermissions, db);

	const organizationEmailPairs =
		await run("Finding organization-user pairs.", findOrganizationUserPairs, db);

	await run("Inviting users to their organizations using API.", inviteUsers, ax, organizationEmailPairs);

	await run("Logging the super user out.", logoutSuperUser, ax);

	await run("Removing super user permissions in the database.", removeSuperPermissions, db);

	await run("Deleting super user from the database.", purgeSuperUser, db);

	await run("Running checks.", runChecks, db);

	await run("Finding orphans (documents without any policies).", findOrphans, db);
}

async function run(label, fn, ...args) {
	// Runs the given async function with the given args, inside a console group made of the given label.
	console.time("time");
	console.group(label);
	const result = await fn(...args);
	console.timeEnd("time");
	console.groupEnd();
	console.log();
	return result;
}

async function signUpSuperUser(ax) {
	const signUpResponse = await ax.post("users", {
		name: SUPER_EMAIL,
		email: SUPER_EMAIL,
		source: "FORM",
		state: "ACTIVATED",
		isEnabled: "true",
		password: SUPER_PASSWORD,
	});

	if (!signUpResponse.data.responseMeta.success) {
		console.log("Sign up failed", signUpResponse.data.responseMeta.error);
		throw new Error("Sign up failed: " + signUpResponse.data.responseMeta.error.message);
	}
}

async function loginSuperUser(ax) {
	const loginParams = new URLSearchParams();
	loginParams.append("username", SUPER_EMAIL);
	loginParams.append("password", SUPER_PASSWORD);

	const loginResponse = await ax.post("login", loginParams, {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});

	if (loginResponse.request.path !== "/") {
		console.log("Login failed", loginResponse);
		throw new Error("Login failed: " + loginResponse.data);
	}

	console.log("Logged in. Trying to get super user profile to verify session.");
	console.log("cookieJar.store", ax.defaults.jar.store);

	const profileResponse = await ax.get("users/me");
	if (!profileResponse.data.responseMeta.success) {
		console.log(profileResponse);
		throw new Error("Failure logging in as super user.");
	}
}

async function logoutSuperUser(ax) {
	await ax.post("logout");
}

function* computeSuperPermissions() {
	for (const collectionName of ["organization", "page", "action", "application", "datasource"]) {
		for (const scope of ["read", "manage"]) {
			const permission = scope + ":" + collectionName + "s";
			yield [collectionName, permission];
		}
	}
}

async function addSuperPermissions(db) {
	const promises = [];

	for (const [collectionName, permission] of computeSuperPermissions()) {
		promises.push(addPermission(db.collection(collectionName), permission));
	}

	await Promise.all(promises);

	async function addPermission(collection, permission) {
		console.log(`Adding policy for permission ${permission}.`);
		await collection.updateMany(
			{ "policies.permission": { $ne: permission } },
			{
				$push: {
					policies: {
						permission,
						users: [],
						groups: [],
					},
				},
			},
		);

		console.log(`Adding superuser to permission ${permission}.`);
		await collection.updateMany(
			{ "policies.permission": permission },
			{
				$addToSet: {
					"policies.$.users": SUPER_EMAIL,
				},
			},
		);
	}
}

async function removeSuperPermissions(db) {
	const promises = [];

	for (const [collectionName, permission] of computeSuperPermissions()) {
		promises.push(removePermission(db.collection(collectionName), permission));
	}

	await Promise.all(promises);

	async function removePermission(collection, permission) {
		console.log(`Removing superuser from permission '${permission}'.`);

		await collection.updateMany(
			{ "policies.permission": permission },
			{
				$pull: {
					"policies.$.users": SUPER_EMAIL,
				},
			},
		);

		console.log(`Cleaning up empty policies for permission '${permission}'.`)
		await collection.updateMany(
			{ policies: { $exists: true } },
			{
				$pullAll: {
					policies: [
						{ permission, users: [], groups: [] },
					],
				},
			}
		);
	}
}

async function addSelfPermissions(db) {
	const userCollection = db.collection("user");

	const cursor = userCollection
		.find({ email: { $exists: true } })
		.project({ email: 1, policies: 1 });

	const promises = [];

	while (await cursor.hasNext()) {
		const user = await cursor.next();
		if (user === null) {
			break;
		}

		const policies = user.policies || [];

		const permissionsToAdd = new Set([
			"read:users",
			"manage:users",
			"resetPassword:users",
			"read:userOrganization",
			"manage:userOrganization",
		]);

		for (const policy of policies) {
			if (permissionsToAdd.delete(policy.permission) && policy.users.indexOf(user.email) < 0) {
				policy.users.push(user.email);
			}
		}

		for (const permission of permissionsToAdd) {
			policies.push({
				permission,
				users: [
					user.email,
				],
				groups: [],
			})
		}

		promises.push(userCollection.updateOne({ _id: user._id }, { $set: { policies } }));
	}

	await Promise.all(promises);
}

async function findOrganizationUserPairs(db) {
	const pairs = [];
	return new Promise((resolve, reject) => {
		db.collection("user")
			.find({ organizationIds: { $exists: true }, email: { $exists: true, $not: { $eq: SUPER_EMAIL } } })
			.project({ email: 1, organizationIds: 1 })
			.forEach(
				doc => {
					for (const organizationId of doc.organizationIds) {
						pairs.push({ organizationId, email: doc.email });
					}
				},
				err => {
					if (err === null) {
						console.info(`Identified ${pairs.length} invitation(s) to be sent.`);
						resolve(pairs);
					} else {
						console.error(err);
						reject(err);
					}
				}
			);
	});
}

async function inviteUsers(ax, organizationEmailPairs) {
	for (const { organizationId, email } of organizationEmailPairs) {
		console.log(`Inviting '${email}' to organizationId: '${organizationId}'.`);

		const membersResponse = (await ax.get(`organizations/${organizationId}/members`)).data;
		if (membersResponse.responseMeta.success
				&& membersResponse.data.filter(({ username }) => username === email).length > 0) {
			console.log("User already has access to this organization. Not inviting.");
			continue;
		}

		const response = await ax.post("users/invite", {
			email,
			orgId: organizationId,
			roleName: "Administrator",
		});

		if (!response.data.responseMeta.success) {
			console.error("response.data", response.data);
		}
	}
}

async function purgeSuperUser(db, isSilent) {
	console.log("Deleting super user.");
	const deleteUsersResult = await db.collection("user").deleteOne({ email: SUPER_EMAIL });
	if (!isSilent && deleteUsersResult.deletedCount !== 1) {
		throw new Error("Unexpected deleted count when deleting super user: " + deleteUsersResult.deletedCount);
	}

	console.log("Deleting super user's personal organization.");
	const deleteOrgResult = await db.collection("organization").deleteOne({ name: SUPER_EMAIL + "'s Personal Organization" });
	if (!isSilent && deleteOrgResult.deletedCount !== 1) {
		throw new Error("Unexpected deleted count when deleting super user's organization: " + deleteOrgResult.deletedCount);
	}
}

async function runChecks(db) {
	for (const collection of await db.collections()) {
		if (await collection.countDocuments({ "policies.users": SUPER_EMAIL }) !== 0 ) {
			console.error(`Super user lives on in the '${collection.collectionName}' collection.`);
		}
	}
}

async function findOrphans(db) {
	const counts = new Map;
	for (const collectionName of ["organization", "page", "action", "application", "datasource"]) {
		counts.set(
			collectionName,
			await db.collection(collectionName).countDocuments({
				policies: { $exists: true, $size: 0 },
				deleted: false,
			})
		);
	}

	console.log("Documents with policies=[], and deleted=false:", counts);

	const organizationCollection = db.collection("organization");

	let missedOrganizations = 0;
	const organizationsInLimbo = new Set();
	for await (const organization of cursorIterator(
		organizationCollection.find({ policies: { $exists: true, $size: 0 }, deleted: false }))
		) {

		const count = await db.collection("user").countDocuments({
			organizationIds: organization._id.toString(),
			deleted: false,
		});

		if (count > 0) {
			++missedOrganizations;
			console.log("Missed organization", organization._id.toString());
		} else {
			organizationsInLimbo.add(organization._id.toString());
		}
	}

	let missedDatasources = 0;
	const datasourcesInLimbo = new Set();
	for await (const datasource of cursorIterator(db.collection("datasource")
		.find({
			policies: { $exists: true, $size: 0 },
			organizationId: { $exists: true },
			deleted: false,
		}))) {

		if (organizationsInLimbo.has(datasource.organizationId) || !ObjectID.isValid(datasource.organizationId)) {
			datasourcesInLimbo.add(datasource._id.toString());
			continue;
		}

		const count = await organizationCollection.countDocuments({
			_id: new ObjectID(datasource.organizationId),
			deleted: false,
		});

		if (count > 0) {
			++missedDatasources;
			console.log("Missed datasource", datasource._id.toString());
		} else {
			datasourcesInLimbo.add(datasource._id.toString());
		}
	}

	let missedApplications = 0;
	const applicationsInLimbo = new Set();
	for await (const application of cursorIterator(db.collection("application")
		.find({
			policies: { $exists: true, $size: 0 },
			organizationId: { $exists: true },
			deleted: false,
		}))) {

		if (organizationsInLimbo.has(application.organizationId) || !ObjectID.isValid(application.organizationId)) {
			applicationsInLimbo.add(application._id.toString());
			continue;
		}

		const count = await organizationCollection.countDocuments({
			_id: new ObjectID(application.organizationId),
			deleted: false,
		});

		if (count > 0) {
			++missedApplications;
			console.log("Missed application", application._id.toString());
		} else {
			applicationsInLimbo.add(application._id.toString());
		}
	}

	const pageCursor = db.collection("page").find({
		policies: { $exists: true, $size: 0 },
		applicationId: { $exists: true },
		deleted: false,
	});

	let missedPages = 0;
	const pagesInLimbo = new Set();

	for await (const page of cursorIterator(pageCursor)) {
		if (applicationsInLimbo.has(page.applicationId) || !ObjectID.isValid(page.applicationId)) {
			pagesInLimbo.add(page._id.toString());
			continue;
		}

		const count = await db.collection("application").countDocuments({
			_id: new ObjectID(page.applicationId),
			deleted: false,
		});

		if (count > 0) {
			++missedPages;
			console.log("Missed page", page._id.toString());
		} else {
			pagesInLimbo.add(page._id.toString());
		}
	}

	const actionCursor = db.collection("action").find({
		policies: { $exists: true, $size: 0 },
		pageId: { $exists: true },
		deleted: false,
	});

	let missedActions = 0;
	const actionsInLimbo = new Set();

	for await (const action of cursorIterator(actionCursor)) {
		if (pagesInLimbo.has(action.pageId) || !ObjectID.isValid(action.pageId)) {
			actionsInLimbo.add(action._id.toString());
			continue;
		}

		const count = await db.collection("page").countDocuments({
			_id: new ObjectID(action.pageId),
			deleted: false,
		});

		if (count > 0) {
			++missedActions;
		} else {
			actionsInLimbo.add(action._id.toString());
		}
	}

	console.log("These are missing policies, where they shouldn've had some policies:", {
		organizations: missedOrganizations,
		datasources: missedDatasources,
		applications: missedApplications,
		pages: missedPages,
		actions: missedActions,
	});

	if (missedOrganizations + missedDatasources + missedApplications + missedPages + missedActions === 0) {
		console.log("Database state looks good.");
	} else {
		console.error("There's some documents that are missing policies, but that should've had some. Please check.");
	}
}

async function* cursorIterator(cursor) {
	while (true) {
		const doc = await cursor.next();
		if (doc === null) {
			break;
		}
		yield doc;
	}
}
