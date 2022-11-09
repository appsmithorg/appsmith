const fsPromises = require('fs/promises');
const Constants = require('./constants');

async function backup_error(err) {
  console.error(err);
  try {
    await fsPromises.access(Constants.APPSMITHCTL_LOG_PATH);
  } catch (error) {
    await fsPromises.mkdir(Constants.APPSMITHCTL_LOG_PATH);
  }
  await fsPromises.appendFile(Constants.APPSMITHCTL_LOG_PATH + '/backup.log', new Date().toISOString() + ' [ ERROR ] ' + err  + '\n');
}

async function backup_info(msg) {
  console.log(msg);
  try {
    await fsPromises.access(Constants.APPSMITHCTL_LOG_PATH);
  } catch (error) {
    await fsPromises.mkdir(Constants.APPSMITHCTL_LOG_PATH);
  }
  await fsPromises.appendFile(Constants.APPSMITHCTL_LOG_PATH + '/backup.log', new Date().toISOString() + ' [ INFO ] ' + msg + '\n');
}

module.exports = {
  backup_error,
  backup_info,
};
