import { MongoClient, MongoServerError } from "mongodb";

import { preprocessMongoDBURI } from "./utils";

/**
 * Builds a MongoClient from a connection string, applying the same
 * preprocessing the other ctl commands use. Does not connect.
 */
export function createClient(uri: string) {
  return new MongoClient(preprocessMongoDBURI(uri));
}

/**
 * Entry point for `appsmithctl check-replica-set`. Exits 0 when the database
 * behind APPSMITH_DB_URL is a replica set, 1 otherwise.
 */
export async function exec() {
  const uri = process.env.APPSMITH_DB_URL;

  if (!uri) {
    console.error("APPSMITH_DB_URL is not set");
    process.exit(1);
  }

  const client = createClient(uri);

  let isReplicaSetEnabled = false;

  try {
    isReplicaSetEnabled = await checkReplicaSet(client);
  } catch (err) {
    console.error("Error trying to check replicaset", err);
  } finally {
    await client.close();
  }

  process.exit(isReplicaSetEnabled ? 0 : 1);
}

async function checkReplicaSet(client: MongoClient) {
  await client.connect();

  return await new Promise<boolean>((resolve) => {
    try {
      const changeStream = client
        .db()
        .collection("user")
        .watch()
        .on("change", (change) => console.log(change))
        .on("error", (err) => {
          if (
            err instanceof MongoServerError &&
            err.toString() ==
              "MongoServerError: The $changeStream stage is only supported on replica sets"
          ) {
            console.log("Replica set not enabled");
          } else {
            console.error("Error even from changeStream", err);
          }

          resolve(false);
        });

      // setTimeout so the error event can kick-in first
      setTimeout(() => {
        resolve(true);
        changeStream.close();
      }, 1000);
    } catch (err) {
      console.error("Error thrown when checking replicaset", err);
      resolve(false);
    }
  });
}
