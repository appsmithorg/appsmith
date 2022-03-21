const { MongoClient } = require("mongodb");

async function exec() {
  const client = new MongoClient(process.env.APPSMITH_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let isReplicaSetEnabled = false;

  try {
    isReplicaSetEnabled = await checkReplicaSet(client);
  } catch (err) {
    console.error("Error trying to check replicaset", err);
  } finally {
    client.close();
  }

  process.exit(isReplicaSetEnabled ? 0 : 1);
}

async function checkReplicaSet(client) {
  await client.connect();
  return await new Promise((resolve) => {
    try {
      client
        .db()
        .collection("user")
        .watch()
        .on("change", (change) => console.log(change))
        .on("error", (err) => {
          console.error("Error even from changeStream", err);
          resolve(false);
        });

      // setTimeout so the error event can kick-in first
      setTimeout(() => {
        resolve(true);
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
