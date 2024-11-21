const { MongoClient, MongoServerError } = require("mongodb");
const { preprocessMongoDBURI } = require("./utils");

async function exec() {
  const client = new MongoClient(
    preprocessMongoDBURI(process.env.APPSMITH_DB_URL),
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

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

async function checkReplicaSet(client) {
  await client.connect();
  return await new Promise((resolve) => {
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

module.exports = {
  exec,
};
