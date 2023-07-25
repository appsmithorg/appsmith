import { MongoClient } from "mongodb";
import { transformDSL } from "./transform";
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = "mongodb://localhost:27017/?replicaSet=rs0";
const client = new MongoClient(url);

// Database Name
const dbName = "appsmith";

async function migrateChunk(db: any, chunked_docs: any[]) {
  const bulk = db.collection("newPage").initializeUnorderedBulkOp();
  let errored = false;
  while (chunked_docs.length > 0) {
    const item = chunked_docs.pop();
    // console.log(">>>", item._id);

    const to_update: any = {};

    try {
      if (item?.unpublishedPage?.layouts?.[0]?.dsl) {
        item.unpublishedPage.layouts[0].dsl = transformDSL(
          item.unpublishedPage.layouts[0].dsl,
          false,
        );
        to_update.unpublishedPage = { ...item.unpublishedPage };
      }

      if (item?.publishedPage?.layouts?.[0]?.dsl) {
        item.publishedPage.layouts[0].dsl = transformDSL(
          item.publishedPage.layouts[0].dsl,
          false,
        );
        to_update.publishedPage = { ...item.publishedPage };
      }

      if (Object.keys(to_update).length > 0) {
        bulk.find({ _id: item._id }).updateOne({
          $set: { ...to_update },
        });
      }
    } catch (err) {
      console.log(item._id);
      console.error(err);
      errored = true;
      break;
    }
  }

  if (errored) {
    return false;
  }

  await bulk.execute();
  return true;
  //   console.log("Found documents =>", result);
}

async function main() {
  console.time("INIT");
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);

  const CHUNK_SIZE = 1000;

  const col = db.collection("newPage");
  const docs = col.find({}, { batchSize: CHUNK_SIZE + 1 });

  // const total_pages = Math.ceil(total / CHUNK_SIZE);

  // console.log({ total, total_pages });
  console.timeEnd("INIT");

  console.time("TOTAL MIGRATION");

  let chunked_docs = [];
  let page = 1;

  for await (const doc of docs) {
    chunked_docs.push(doc);
    // console.log(">>>", doc._id);

    // console.log((await docs.toArray()).length);
    if (chunked_docs.length === CHUNK_SIZE) {
      console.time("Page - " + page);
      const state = await migrateChunk(db, chunked_docs);
      if (!state) break;
      console.timeEnd("Page - " + page);
      page += 1;
      chunked_docs = [];
    }
    // chunked_docs.push(doc);

    // if(chunked_docs.length == 100) {

    // }
    // console.log("Migrating Page - ", page);
    // await migrateChunk(db, skip, limit);
    // console.log("Migrated Page - ", page);
  }

  console.timeEnd("TOTAL MIGRATION");

  // Use connect method to connect to the server
  //   await client.connect();
  //   console.log("Connected successfully to server");
  //   const db = client.db(dbName);
  //   const collection = db.collection("newPage");

  //   const findResult = await collection
  //     .find({}, { skip: 0, limit: 100 })
  //     .toArray();
  //   console.log("Found documents =>", findResult);

  // the following code examples can be pasted here...

  return "done.";
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
