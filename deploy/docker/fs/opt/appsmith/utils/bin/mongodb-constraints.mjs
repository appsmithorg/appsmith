import {MongoClient} from "mongodb";

// Don't use `localhost` here, it'll try to connect on IPv6, irrespective of whether you have it enabled or not.
let mongoDbUrl = "mongodb+srv://one:arkham@test1.xsfdf.mongodb.net/i1";

const mongoClient = await new MongoClient(mongoDbUrl);
mongoClient.on("error", console.error);
const db = mongoClient.db();

for await (const {name: collectionName} of db.listCollections({}, {nameOnly: true})) {
  await getConstraints(collectionName)
}

async function getConstraints(collection) {
  const indexes = await db.indexInformation(collection, {
    full: true,
  })

  const tableName = camelToSnake(collection);

  for (const index of indexes) {
    if (index.unique) {
      const fields = Object.keys(index.key);
      const columns = fields.map(f => camelToSnake(f).replaceAll(/\./g, "_"))
      // TODO: Index name cannot be longer than 63 chars?
      console.log(`CREATE UNIQUE INDEX ${tableName}_${columns.join("_")}_key ON "${tableName}" ("${columns.join(`", "`)}");`)
    }
  }
}

await mongoClient.close();

console.log("done");

// TODO(Shri): We shouldn't need this.
process.exit(0);

function camelToSnake(str) {
  // Adapted from the `loadMongoData` Flyway migration.
  return str.replaceAll(/([a-z])([A-Z](?=[a-z]))/g, "$1_$2").toLowerCase()
}
