import { spawn } from "child_process";
import { MongoClient } from "mongodb";
import * as fs from "node:fs";

const EXPORT_ROOT = "/appsmith-stacks/mongo-data";
const MINIMUM_MONGO_CHANGESET = "add_empty_policyMap_for_null_entries";
const MONGO_MIGRATION_COLLECTION = "mongockChangeLog";

/**
 * Moves data from MongoDB to JSONL files, with optional baseline mode filtering.
 *
 * This script connects to a MongoDB instance, optionally restores from a dump file,
 * and exports data from all collections to JSONL files. In baseline mode, specific
 * filters are applied to exclude certain data.
 *
 * @param {string} mongoDbUrl - The URL of the MongoDB.
 * @returns {Promise<void>} - A promise that resolves when the data migration is complete.
 */
export async function writeDataFromMongoToJsonlFiles(mongoDbUrl) {
  let isBaselineMode = false;
  let mongoDumpFile = null;

  // Process command line arguments
  for (let i = 2; i < process.argv.length; ++i) {
    const arg = process.argv[i];
    if (arg.startsWith("--mongodb-url=") && !mongoDbUrl) {
      mongoDbUrl = extractValueFromArg(arg);
    } else if (arg.startsWith("--mongodb-dump=") && !mongoDumpFile) {
      mongoDumpFile = extractValueFromArg(arg);
    } else if (arg === "--baseline") {
      isBaselineMode = true;
      console.warn(
        "Running in baseline mode. If you're not an Appsmith team member, we sure hope you know what you're doing.",
      );
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
    fs.mkdirSync("/tmp/db-tmp", { recursive: true });

    mongoServer = spawn(
      "mongod",
      ["--bind_ip_all", "--dbpath", "/tmp/db-tmp", "--port", "27500"],
      {
        stdio: "inherit",
      },
    );

    mongoDbUrl = "mongodb://localhost/tmp";

    spawn("mongorestore", [
      mongoDbUrl,
      "--archive=" + mongoDumpFile,
      "--gzip",
      "--noIndexRestore",
    ]);
  }

  const mongoClient = new MongoClient(mongoDbUrl);
  mongoClient.on("error", console.error);
  await mongoClient.connect();
  const mongoDb = mongoClient.db();

  fs.rmSync(EXPORT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(EXPORT_ROOT, { recursive: true });

  const filters = {};

  if (isBaselineMode) {
    filters.config = {
      name: { $ne: "appsmith_registered" },
    };
    filters.plugin = {
      packageName: { $ne: "saas-plugin" },
    };
  }

  const collectionNames = await mongoDb
    .listCollections({}, { nameOnly: true })
    .toArray();
  const sortedCollectionNames = collectionNames
    .map((collection) => collection.name)
    .sort();

  if (!(await isMongoDataMigratedToStableVersion(mongoDb))) {
    console.error(
      "MongoDB migration check failed: Try upgrading the Appsmith instance to latest before opting for data migration.",
    );
    console.error(
      `Could not find the valid migration execution entry for "${MINIMUM_MONGO_CHANGESET}" in the "${MONGO_MIGRATION_COLLECTION}" collection.`,
    );
    await mongoClient.close();
    mongoServer?.kill();
    process.exit(1);
  }

  for await (const collectionName of sortedCollectionNames) {
    console.log("Collection:", collectionName);
    if (isBaselineMode && collectionName.startsWith("mongock")) {
      continue;
    }
    let outFile = null;
    for await (const doc of mongoDb
      .collection(collectionName)
      .find(filters[collectionName])) {
      if (isArchivedObject(doc)) {
        continue;
      }
      transformFields(doc);
      if (doc.policyMap == null) {
        doc.policyMap = {};
      }

      if (outFile == null) {
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

  process.exit(0);
}

/**
 * Extracts value from command line argument
 * @param {string} arg - Command line argument in format "--key=value"
 * @returns {string} The extracted value
 */
function extractValueFromArg(arg) {
  return arg.replace(/^.*?=/, "");
}

/**
 * Checks if a document is marked as archived/deleted
 * @param {Object} doc - MongoDB document
 * @returns {boolean} True if document is archived/deleted
 */
function isArchivedObject(doc) {
  return doc.deleted === true || doc.deletedAt != null;
}

/**
 * Converts object to JSON string with sorted keys
 * @param {Object} obj - Object to stringify
 * @returns {string} JSON string with sorted keys
 */
function toJsonSortedKeys(obj) {
  // We want the keys sorted in the serialized JSON string, so that everytime we run this script, we don't see diffs
  // that are just keys being reshuffled, which we don't care about, and don't need a diff for.
  return JSON.stringify(obj, replacer);
}

/**
 * Replacer function for JSON.stringify that sorts object keys
 * @param {string} key - The current key
 * @param {any} value - The current value
 * @returns {any} The processed value
 */
function replacer(key, value) {
  // Ref: https://gist.github.com/davidfurlong/463a83a33b70a3b6618e97ec9679e490
  return value instanceof Object && !Array.isArray(value)
    ? Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {})
    : value;
}

/**
 * Method to transform the data in the object to be compatible with Postgres.
 * Updates:
 * 1. Changes the _id field to id, and removes the _id field.
 * 2. Replaces the _class field with the appropriate type field.
 * @param {Document} obj - The object to transform.
 * @returns {void} - No return value.
 */
function transformFields(obj) {
  for (const key in obj) {
    if (key === "_id") {
      obj.id = obj._id.toString();
      delete obj._id;
    } else if (key === "_class") {
      const type = mapClassToType(obj._class);
      if (type) {
        obj.type = type;
      }
      delete obj._class;
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      transformFields(obj[key]);
    }
  }
}

/**
 * Map the _class field to the appropriate type value. The DatasourceStorage class requires this check
 * @param {string} _class - The _class field value.
 * @returns {string|null} - The corresponding type value, or null if no match is found.
 */
function mapClassToType(_class) {
  switch (_class) {
    case "com.appsmith.external.models.DatasourceStructure$PrimaryKey":
      return "primary key";
    case "com.appsmith.external.models.DatasourceStructure$ForeignKey":
      return "foreign key";
    default:
      return null;
  }
}

/**
 * Method to check if MongoDB data has migrated to a stable version before we start migrating the data to Postgres.
 * @param {*} mongoDb - The MongoDB client.
 * @returns {Promise<boolean>} - A promise that resolves to true if the data has been migrated to a stable version, false otherwise.
 */
async function isMongoDataMigratedToStableVersion(mongoDb) {
  const doc = await mongoDb.collection(MONGO_MIGRATION_COLLECTION).findOne({
    changeId: MINIMUM_MONGO_CHANGESET,
    state: "EXECUTED",
  });
  return doc !== null;
}

// Parse command line arguments
const args = process.argv.slice(2);
let mongoUrl;

for (const arg of args) {
  if (arg.startsWith('--mongodb-url=')) {
    mongoUrl = arg.split('=')[1];
  }
}

if (!mongoUrl) {
  console.error('Usage: node move-to-postgres.mjs --mongodb-url=<url>');
  process.exit(1);
}

writeDataFromMongoToJsonlFiles(mongoUrl).catch(console.error);
