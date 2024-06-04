import { spawn } from "child_process";
import {MongoClient} from "mongodb";
import * as fs from "node:fs"

// Don't use `localhost` here, it'll try to connect on IPv6, irrespective of whether you have it enabled or not.
let mongoDbUrl;

let mongoDumpFile = null;
const EXPORT_ROOT = "mongo-data"

for (let i = 2; i < process.argv.length; ++i) {
  const arg = process.argv[i]
  if (arg.startsWith("--mongodb-url=") && !mongoDbUrl) {
    mongoDbUrl = extractValueFromArg(arg);
  } else if (arg.startsWith("--mongodb-dump=") && !mongoDumpFile) {
    mongoDumpFile = extractValueFromArg(arg)
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

  mongoDbUrl = "mongodb://localhost/tmp"

  // mongorestore 'mongodb://localhost/' --archive=mongodb-data.gz --gzip --nsFrom='appsmith.*' --nsTo='appsmith.*'
  spawn("mongorestore", [mongoDbUrl, "--archive=" + mongoDumpFile, "--gzip", "--noIndexRestore"]);
}

const mongoClient = await new MongoClient(mongoDbUrl);
mongoClient.on("error", console.error)
const mongoDb = mongoClient.db();

fs.mkdirSync(EXPORT_ROOT, {recursive: true});

for await (const {name: collectionName} of mongoDb.listCollections({}, {nameOnly: true})) {
  console.log("Collection:", collectionName);
  const outFile = fs.openSync(EXPORT_ROOT + "/" + collectionName + ".jsonl", "w")
  for await (const doc of mongoDb.collection(collectionName).find()) {
    // TODO(Shri): Should we cleanup nested `ObjectId`s, like all over `doc`?
    doc.id = doc._id.toString();
    delete doc._id;

    fs.writeSync(outFile, JSON.stringify(doc) + "\n")
  }

  fs.closeSync(outFile)
}

await mongoClient.close();
mongoServer?.kill();

console.log("done")

// TODO(Shri): We shouldn't need this.
process.exit(0);

function extractValueFromArg(arg) {
  return arg.replace(/^.*?=/, "");
}
