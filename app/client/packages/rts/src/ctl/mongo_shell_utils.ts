import * as utils from "./utils";

const command_args = process.argv.slice(3);

export async function exec() {
  let errorCode = 0;

  try {
    await execMongoEval(command_args[0], process.env.APPSMITH_DB_URL);
  } catch (err) {
    errorCode = 1;
    console.error("Error evaluating the mongo query", err);
  } finally {
    process.exit(errorCode);
  }
}

async function execMongoEval(queryExpression: string, appsmithMongoURI: string) {
  queryExpression = queryExpression.trim();

  if (command_args.includes("--pretty")) {
    queryExpression += ".pretty()";
  }

  return await utils.execCommand([
    "mongosh",
    appsmithMongoURI,
    `--eval=${queryExpression}`,
  ]);
}
