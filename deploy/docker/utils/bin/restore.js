const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');

const shell = require('shelljs');

const utils = require('./utils');
const Constants = require('./constants');


async function run() {
  let errorCode = 0;
  try {
    check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1';
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

    console.log('Stopping backend & rts');
    utils.stop(['backend', 'rts']);

    const backupFiles = [];
    for (const item of fsPromises.readdir(Constants.BACKUP_PATH)) {
      if (item.match(/^appsmith-backup-.*\.tar\.gz$/)) {
        backupFiles.push(item);
      }
    }

    console.log("Select a backup file to restore:\n" + backupFiles.join("\n\t"))

  } catch (err) {
    console.log(err);
    errorCode = 1;

  } finally {
    utils.start(['backend', 'rts']);
    process.exit(errorCode);

  }
}

module.exports = {
  run,
};
