// Init function export mongodb
const shell = require('shelljs');
const readlineSync = require('readline-sync');
const process = require('process');
const Constants = require('./constants');
const utils = require('./utils');


function import_database() {
  console.log('import_database  ....')
  dbUrl = utils.getDburl();
  const cmd = `mongorestore --uri='${dbUrl}' --drop --archive='${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}' --gzip`
  shell.exec(cmd)
  console.log('import_database done')
}

function stop_application() {
  shell.exec('/usr/bin/supervisorctl stop backend rts')
}

function start_application() {
  shell.exec('/usr/bin/supervisorctl start backend rts')
}

// Main application workflow
const main = (forceOption) => {
  let errorCode = 0
  try {

    check_supervisord_status_cmd = '/usr/bin/supervisorctl'
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        console.log('application is not running, starting supervisord')
        shell.exec('/usr/bin/supervisord')
      }
    })

    console.log('stop backend & rts application before import database')
    stop_application()
    const shellCmdResult = shell.exec(`mongo ${process.env.APPSMITH_DB_URL} --quiet --eval "db.getCollectionNames().length"`)
    const collectionsLen = parseInt(shellCmdResult.stdout.toString().trimEnd())
    if (collectionsLen > 0) {
      if (forceOption) {
        import_database()
        return
      }
      console.log()
      console.log('**************************** WARNING ****************************')
      console.log(`Your target database is not empty, it has data in ${collectionsLen} collections.`)
      const input = readlineSync.question('Importing this DB will erase this data. Are you sure you want to proceed?[Yes/No] ')
      const answer = input && input.toLocaleUpperCase()
      if (answer === 'Y' || answer === 'YES') {
        import_database()
        return
      } else if (answer === 'N' || answer === 'NO') {
        return
      }
      console.log(`Your input is invalid. Please try to run import command again.`)
      return
    } else {
      import_database()
      return
    }
  } catch (err) {
    console.log(err)
    errorCode = 1
  } finally {
    console.log('start backend & rts application after import database')
    start_application()
    process.exit(errorCode)
  }
}

module.exports = {
  runImportDatabase: main,
}
