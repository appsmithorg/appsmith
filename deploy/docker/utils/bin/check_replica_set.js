const { MongoClient } = require("mongodb");

async function exec() {
  const client = new MongoClient(process.env.APPSMITH_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  checkReplicaSet(client)
    .then((res) => {
      // support replica set
      if (res === 0) {
        client.close();
        process.exit(0);
      }

      // not support replica set
      if (res === 1) {
        client.close();
        process.exit(1);
      }
    })
    .catch((err) => {
      // exit 1 for any other error
      client.close();
      process.exit(1);
    });
}

async function checkReplicaSet(client) {
  await client.connect();
  return await new Promise((resolve) => {
    try {
      client
        .watch()
        .on("change", (change) => console.log(change))
        .on("error", () => resolve(1));

      // setTimeout so the error event can kick-in first
      setTimeout(() => {
        resolve(0);
      }, 1000);
    } catch (err) {
      console.log(err.stack);
      resolve(1);
    }
  });
}

module.exports = {
  exec,
};
