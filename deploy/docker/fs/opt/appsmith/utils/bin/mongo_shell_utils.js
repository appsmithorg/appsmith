
const utils = require('./utils');

const command_args = process.argv.slice(3);

async function exec() {
  let errorCode = 0;
  try {
    await execMongoEval(command_args[0], process.env.APPSMITH_MONGODB_URI);
  } catch (err) {
    errorCode = 1;
    console.error('Error evaluating the mongo query', err);
  } finally {
    process.exit(errorCode);
  }
}

async function execMongoEval(queryExpression, appsmithMongoURI) {
  queryExpression = queryExpression.trim();
  if (command_args.includes('--pretty')) {
    queryExpression += '.pretty()';
  }
  return await utils.execCommand(['mongosh', appsmithMongoURI, `--eval=${queryExpression}`]);
}

module.exports = {
  exec
};
