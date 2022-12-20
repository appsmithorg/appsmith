const bk = require('./backup');

async function exec() {
  let version = null;
  try {
    version = await bk.getCurrentVersion();
  } catch (err) {
    console.error("Error fetching current Appsmith version", err);
    process.exit(1);
  }
  if (version) {
    console.log(version);
  }
  else {
    console.log("Error: could not find the current Appsmith version")
    process.exit(1);
  }
}

module.exports = {
  exec,
};
