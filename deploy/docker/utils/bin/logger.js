const fsPromises = require('fs/promises');
const Constants = require('./constants');

async function backup_error(err){
    try {
      await fsPromises.access(Constants.BACKUP_ERROR_LOG_PATH);
    } catch (error) {
      await fsPromises.mkdir(Constants.BACKUP_ERROR_LOG_PATH)
    }
    await fsPromises.appendFile(Constants.BACKUP_ERROR_LOG_PATH + '/error.log', new Date().toISOString() + ' ' + err + '\n');
  }

module.exports = {
    backup_error,
  };
  