// Init function export mongodb
const shell = require('shelljs');
const readlineSync = require('readline-sync');
const process = require('process');
const Constants = require('./constants')

function import_database() {
  console.log('import_database  ....')
  const cmd = `mongorestore --uri='${process.env.APPSMITH_MONGODB_URI}' --drop --archive='${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}' --gzip`
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
        shell.echo('application is not running, starting supervisord')
        shell.exec('/usr/bin/supervisord')
      }
    })

    shell.echo('stop backend & rts application before import database')
    stop_application()
    const shellCmdResult = shell.exec(`mongo ${process.env.APPSMITH_MONGODB_URI} --quiet --eval "db.getCollectionNames().length"`)
    const collectionsLen = parseInt(shellCmdResult.stdout.toString().trimEnd())
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
};
