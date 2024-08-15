import {spawn} from "child_process";
import {MongoClient} from "mongodb";
import * as fs from "node:fs";

let isBaselineMode = false;

// Don't use `localhost` here, it'll try to connect on IPv6, irrespective of whether you have it enabled or not.
let mongoDbUrl;

let mongoDumpFile = null;
const EXPORT_ROOT = "mongo-data";

for (let i = 2; i < process.argv.length; ++i) {
  const arg = process.argv[i];
  if (arg.startsWith("--mongodb-url=") && !mongoDbUrl) {
    mongoDbUrl = extractValueFromArg(arg);
  } else if (arg.startsWith("--mongodb-dump=") && !mongoDumpFile) {
    mongoDumpFile = extractValueFromArg(arg);
  } else if (arg === "--baseline") {
    isBaselineMode = true;
    console.warn("Running in baseline mode. If you're not an Appsmith team member, we sure hope you know what you're doing.")
  } else {
    console.error("Unknown/unexpected argument: " + arg);
    process.exit(1);
  }
}

if (!mongoDbUrl && !mongoDumpFile) {
  console.error("No source specified");
  process.exit(1);
}

let mongoServer;
if (mongoDumpFile) {
  fs.mkdirSync("/tmp/db-tmp", {recursive: true});

  mongoServer = spawn("mongod", ["--bind_ip_all", "--dbpath", "/tmp/db-tmp", "--port", "27500"], {
    stdio: "inherit",
  });

  mongoDbUrl = "mongodb://localhost/tmp";

  // mongorestore 'mongodb://localhost/' --archive=mongodb-data.gz --gzip --nsFrom='appsmith.*' --nsTo='appsmith.*'
  spawn("mongorestore", [mongoDbUrl, "--archive=" + mongoDumpFile, "--gzip", "--noIndexRestore"]);
}

const mongoClient = await new MongoClient(mongoDbUrl);
mongoClient.on("error", console.error);
const mongoDb = mongoClient.db();

fs.mkdirSync(EXPORT_ROOT, {recursive: true});

const filters = {};

if (isBaselineMode) {
  filters.config = {
    // Remove the "appsmith_registered" value, since this is baseline static data, and we want new instances to do register.
    name: {$ne: "appsmith_registered"},
  };
  filters.plugin = {
    // Remove saas plugins so they can be fetched from CS again, as usual.
    packageName: {$ne: "saas-plugin"},
  };
}

for await (const {name: collectionName} of mongoDb.listCollections({}, {nameOnly: true})) {
  console.log("Collection:", collectionName);
  if (isBaselineMode && collectionName.startsWith("mongock")) {
    continue;
  }
  let outFile = null;
  for await (const doc of mongoDb.collection(collectionName).find(filters[collectionName])) {
    // TODO(Shri): Should we cleanup nested `ObjectId`s, like all over `doc`?
    doc.id = doc._id.toString();
    delete doc._id;

    // Skip archived objects as they are not migrated during the Mongock migration which may end up failing for the
    // constraints in the Postgres DB.
    if (isArchivedObject(doc)) {
      continue;
    }

    if (outFile == null) {
      // Don't create the file unless there's data to write.
      outFile = fs.openSync(EXPORT_ROOT + "/" + collectionName + ".jsonl", "w");
    }

    fs.writeSync(outFile, toJsonSortedKeys(doc) + "\n");
  }

  if (outFile != null) {
    fs.closeSync(outFile);
  }
}

await mongoClient.close();
mongoServer?.kill();

console.log("done");

// TODO(Shri): We shouldn't need this.
process.exit(0);

function extractValueFromArg(arg) {
  return arg.replace(/^.*?=/, "");
}

function isArchivedObject(doc) {
  return doc.deleted === true || doc.isDeleted != null;
}

function toJsonSortedKeys(obj) {
  // We want the keys sorted in the serialized JSON string, so that everytime we run this script, we don't see diffs
  // that are just keys being reshuffled, which we don't care about, and don't need a diff for.
  return JSON.stringify(obj, replacer);
}

function replacer(key, value) {
  // Ref: https://gist.github.com/davidfurlong/463a83a33b70a3b6618e97ec9679e490
  return value instanceof Object && !(value instanceof Array) ?
    Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted
      }, {}) :
    value;
}
