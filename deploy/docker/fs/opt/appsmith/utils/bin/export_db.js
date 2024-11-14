// Init function export db
const shell = require('shelljs');
const Constants = require('./constants');
const utils = require('./utils');

function export_database() {
  console.log('export_database  ....');
  dbUrl = utils.getDburl();
  shell.mkdir('-p', [Constants.BACKUP_PATH]);
  let cmd;
  if (dbUrl.startsWith('mongodb')) {
    cmd = `mongodump --uri='${dbUrl}' --archive='${Constants.BACKUP_PATH}/${Constants.DUMP_FILE_NAME}' --gzip`;
  } else if (dbUrl.startsWith('postgresql')) {
    // Dump only the appsmith schema with custom format
    cmd = `pg_dump ${dbUrl} -n appsmith -Fc -f '${Constants.BACKUP_PATH}/${Constants.DUMP_FILE_NAME}'`;
  } else {
    throw new Error('Unsupported database type, only MongoDB and PostgreSQL are supported');
  }
  shell.exec(cmd);
  console.log('export_database done');
}

function stop_application() {
  console.log('stop_application  ....');
  shell.exec('/usr/bin/supervisorctl stop backend rts');
  console.log('stop_application done');
}

function start_application() {
  console.log('start_application  ....');
  shell.exec('/usr/bin/supervisorctl start backend rts');
  console.log('start_application done');
}

// Main application workflow
function run() {
  let errorCode = 0;
  try {
    check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1 ';
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

    shell.echo('stop backend & rts application before export database');
    stop_application();
    export_database();
    shell.echo('start backend & rts application after export database');
    shell.echo();
    shell.echo('\033[0;33m++++++++++++++++++++ NOTE ++++++++++++++++++++');
    shell.echo();
    shell.echo(
      'Please remember to also copy APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file to the target instance where you intend to import this database dump.',
    );
    shell.echo();
    shell.echo('++++++++++++++++++++++++++++++++++++++++++++++\033[0m');
    shell.echo();
  } catch (err) {
    shell.echo(err);
    errorCode = 1;
  } finally {
    start_application();
    process.exit(errorCode);
  }
}

module.exports = {
  run,
  exportDatabase: export_database,
  stopApplication: stop_application,
  startApplication: start_application,
};