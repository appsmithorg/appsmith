/**
 * Moves data from MongoDB to Postgres.
 *
 * @param {string} mongoDbUrl - The URL of the MongoDB.
 * @param {string} mongoDumpFile - The path to the MongoDB dump file.
 * @param {boolean} isBaselineMode - Flag indicating whether the script is running in baseline mode.
 * @returns {Promise<void>} - A promise that resolves when the data migration is complete.
 */
import { spawn } from "child_process";
import { MongoClient } from "mongodb";
import * as fs from "node:fs";

/**
 * Exports MongoDB data to JSONL files.
 *
 * @param {string} mongoDbUrl - The URL of the MongoDB.
 * @returns {Promise<void>} - A promise that resolves when the export is complete.
 */
async function exportMongoToJSONL(mongoDbUrl) {
  const EXPORT_ROOT = "/appsmith-stacks/mongo-data";
  const MINIMUM_MONGO_CHANGESET = "add_empty_policyMap_for_null_entries";
  const MONGO_MIGRATION_COLLECTION = "mongockChangeLog";

  const mongoClient = new MongoClient(mongoDbUrl);
  mongoClient.on("error", console.error);
  await mongoClient.connect();
  const mongoDb = mongoClient.db();

  // Make sure EXPORT_ROOT directory is empty
  fs.rmSync(EXPORT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(EXPORT_ROOT, { recursive: true });

  const collectionNames = await mongoDb
    .listCollections({}, { nameOnly: true })
    .toArray();
  const sortedCollectionNames = collectionNames
    .map((collection) => collection.name)
    .sort();

  // Verify that the MongoDB data has been migrated to a stable version
  if (!(await isMongoDataMigratedToStableVersion(mongoDb))) {
    console.error(
      "MongoDB migration check failed: Try upgrading the Appsmith instance to the latest version before opting for data migration.",
    );
    console.error(
      `Could not find the valid migration execution entry for "${MINIMUM_MONGO_CHANGESET}" in the "${MONGO_MIGRATION_COLLECTION}" collection.`,
    );
    await mongoClient.close();
    process.exit(1);
  }

  for await (const collectionName of sortedCollectionNames) {
    console.log("Collection:", collectionName);
    let outFile = null;
    for await (const doc of mongoDb.collection(collectionName).find()) {
      if (isArchivedObject(doc)) {
        continue;
      }
      transformFields(doc); // This now handles the _class to type transformation.
      if (doc.policyMap == null) {
        doc.policyMap = {};
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

  console.log("done");
}

function isArchivedObject(doc) {
  return doc.deleted === true || doc.deletedAt != null;
}

function toJsonSortedKeys(obj) {
  return JSON.stringify(obj, replacer);
}

function replacer(key, value) {
  return value instanceof Object && !Array.isArray(value)
    ? Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {})
    : value;
}

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

async function isMongoDataMigratedToStableVersion(mongoDb) {
  const doc = await mongoDb.collection(MONGO_MIGRATION_COLLECTION).findOne({
    changeId: "add_empty_policyMap_for_null_entries",
    state: "EXECUTED",
  });
  return doc !== null;
}

