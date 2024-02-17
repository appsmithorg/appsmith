import { spawn } from "child_process";
import {MongoClient} from "mongodb";
import Pg from "pg";

let source

for (let i = 2; i < process.argv.length; ++i) {
  const arg = process.argv[i]
  if (arg.startsWith("--source=") && !source) {
    source = arg.slice("--source=".length);
  } else if (arg === "--source" && !source) {
    source = process.argv[++i];
  } else {
    console.error("Unknown/unexpected argument: " + arg);
    process.exit(1);
  }
}

if (!source) {
  console.error("No --source specified");
  process.exit(1);
}

if (source.startsWith("mongodb://")) {

}

// const mongoServer = spawn("mongod", ["--bind_ip_all", "--dbpath", "/tmp/db-tmp", "--port", "27500"], {
//   stdio: "inherit",
// });

// mongorestore 'mongodb://localhost/' --archive=mongodb-data.gz --gzip --nsFrom='appsmith.*' --nsTo='appsmith.*'
// spawn("mongorestore", ["mongodb://localhost/tmp", "/Users/shri/work/backup-inspector/appsmith-backup-2024-02-17T00-00-02.358Z/mongodb-data.gz"]);

// mongoServer.kill();

// Don't use `localhost` here, it'll try to connect on IPv6, irrespective of whether you have it enabled or not.
const uri = "mongodb://127.0.0.1:27500/appsmith-ee-release-new";

// 1. Connect to MongoDB.
const mongoClient = await new MongoClient(uri);
mongoClient.on("error", console.error)
const mongoDb = mongoClient.db();

// 2. Connect to Postgres.
const pgClient = new Pg.Client({
  database: "postgres",
})
await pgClient.connect();

// 3. Ensure a blank table to store the data.
await pgClient.query(`drop table if exists mongo_data`)
await pgClient.query(`create table mongo_data (
    id text,
    collection text,
    doc jsonb,
    nul_removed boolean,
    constraint mongo_data_pk primary key (id, collection)
)`)

// 4. Copy data from all MongoDB collections to the Postgres table.
for await (const {name: collectionName} of mongoDb.listCollections({}, {nameOnly: true})) {
  console.log("Collection:", collectionName);
  for await (const doc of mongoDb.collection(collectionName).find()) {
    doc.id = doc._id.toString();
    delete doc._id;

    try {
      await pgClient.query(makeQuery(doc.id, collectionName, doc, false));
    } catch (e) {
      if (e.toString() === "error: unsupported Unicode escape sequence") {
        console.warn("Unsupported Unicode escape sequence in " + collectionName + "." + doc.id + ", removing NUL character and trying again");
        await pgClient.query(makeQuery(doc.id, collectionName, JSON.stringify(doc).replaceAll(/\\u0000/g, "", true)));
      } else {
        throw e;
      }
    }
  }
}

await mongoClient.close();
pgClient.release()

console.log("done")

function makeQuery(...args) {
  return {
    name: "insert-mongo-data", // This triggers prepared-statements support.
    text: `INSERT INTO mongo_data VALUES ($1, $2, $3, $4)`,
    values: Array.from(args),
  };
}
