// Init function export mongodb
const shell = require('shelljs');
const readlineSync = require('readline-sync');
const process = require('process');
const Constants = require('./constants');
const utils = require('./utils');


function import_database() {
  console.log('import_database  ....')
  dbUrl = utils.getDburl();
  if (dbUrl.startsWith('mongodb')) {
    restore_mongo_db(dbUrl);
  } else if (dbUrl.startsWith('postgresql')) {
    restore_postgres_db(dbUrl);
  } else {
    throw new Error('Unsupported database type, only MongoDB and PostgreSQL are supported');
  }
  console.log('import_database done')
}

restore_mongo_db = (dbUrl) => {
  const cmd = `mongorestore --uri='${dbUrl}' --drop --archive='${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}' --gzip`;
  shell.exec(cmd);
}

restore_postgres_db = (dbUrl) => {
  let cmd;
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    const toDbName = utils.getDatabaseNameFromDBURI(dbUrl);
    cmd = `pg_restore -U postgres -d 'postgresql://localhost:5432/${toDbName}' --verbose --clean ${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}`;
  } else {
    cmd = `pg_restore -d ${dbUrl} --verbose --clean ${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}`;
  }
  shell.exec(cmd);
}

function stop_application() {
  shell.exec('/usr/bin/supervisorctl stop backend rts')
}

function start_application() {
  shell.exec('/usr/bin/supervisorctl start backend rts')
}

function get_table_or_collection_len() {
  let count;
  const dbUrl = utils.getDburl();
  if (dbUrl.startsWith('mongodb')) {
    count = shell.exec(`mongo ${dbUrl} --quiet --eval "db.getCollectionNames().length"`)
  } else if (dbUrl.startsWith('postgresql')) {
    count = shell.exec(`psql -d ${dbUrl} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'appsmith';"`)
  } else {
    throw new Error('Unsupported database type, only MongoDB and PostgreSQL are supported');
  }
  return parseInt(count.stdout.toString().trimEnd());
}

// Main application workflow
const main = (forceOption) => {
  let errorCode = 0
  try {

    check_supervisord_status_cmd = '/usr/bin/supervisorctl'
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord')
        shell.exec('/usr/bin/supervisord')
      }
    })

    shell.echo('stop backend & rts application before import database')
    stop_application()
    const collectionsLen = get_table_or_collection_len();
    if (collectionsLen > 0) {
      if (forceOption) {
        import_database()
        return
      }
      shell.echo()
      shell.echo('**************************** WARNING ****************************')
      shell.echo(`Your target database is not empty, it has data in ${collectionsLen} collections.`)
      const input = readlineSync.question('Importing this DB will erase this data. Are you sure you want to proceed?[Yes/No] ')
      const answer = input && input.toLocaleUpperCase()
      if (answer === 'Y' || answer === 'YES') {
        import_database()
        return
      } else if (answer === 'N' || answer === 'NO') {
        return
      }
      shell.echo(`Your input is invalid. Please try to run import command again.`)
      return
    } else {
      import_database()
      return
    }
  } catch (err) {
    shell.echo(err)
    errorCode = 1
  } finally {
    shell.echo('start backend & rts application after import database')
    start_application()
    process.exit(errorCode)
  }
}

module.exports = {
  runImportDatabase: main,
}