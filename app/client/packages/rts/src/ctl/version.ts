import * as utils from "./utils";

export async function exec() {
  let version = null;

  try {
    version = await utils.getCurrentAppsmithVersion();
  } catch (err) {
    console.error("Error fetching current Appsmith version", err);
    process.exit(1);
  }

  if (version) {
    console.log(version);
  } else {
    console.error("Error: could not find the current Appsmith version");
    process.exit(1);
  }
}
