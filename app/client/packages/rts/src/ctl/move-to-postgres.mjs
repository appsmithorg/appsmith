/**
 * Moves data from MongoDB to JSONL files, with optional baseline mode filtering.
 *
 * This script connects to a MongoDB instance, optionally restores from a dump file,
 * and exports data from all collections to JSONL files. In baseline mode, specific
 * filters are applied to exclude certain data.
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
 * Copies MongoDB data to JSONL files
 * @param {string} dbUrl - MongoDB connection URL
 * @returns {Promise<void>}
 */
async function copyToJSONL(dbUrl) {
  let isBaselineMode = false;
  let mongoDbUrl = dbUrl;
  let mongoDumpFile = null;
  const EXPORT_ROOT = "/appsmith-stacks/mongo-data";
  const MINIMUM_MONGO_CHANGESET = "add_empty_policyMap_for_null_entries";
  const MONGO_MIGRATION_COLLECTION = "mongockChangeLog";

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