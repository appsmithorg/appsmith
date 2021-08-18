// Init function export mongodb
var shell = require('shelljs')

// Load env configuration
const BACKUP_PATH = '/opt/appsmith/data/backup'

function export_database() {
  console.log('export_database  ....')
  shell.mkdir('-p', [`${BACKUP_PATH}`]);
  const cmd = `mongodump --uri='${process.env.APPSMITH_MONGODB_URI}' --archive=${BACKUP_PATH}/data.archive --gzip`
  shell.exec(cmd)
  console.log('export_database done')
}

function stop_application() {
  console.log('stop_application  ....')
  shell.exec('/usr/bin/supervisorctl stop backend rts')
  console.log('stop_application done')
}

function start_application() {
  console.log('start_application  ....')
  shell.exec('/usr/bin/supervisorctl start backend rts')
  console.log('start_application done')
}

// Main application workflow
function main() {
  try {
    check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1 '
    shell.exec(check_supervisord_status_cmd, function(code) {
      if(code > 0  ) {
        shell.echo('application is not running, starting supervisord')
        shell.exec('/usr/bin/supervisord')
      }
    })

    shell.echo('stop backend & rts application before export database')
    stop_application()
    export_database()
    shell.echo('start backend & rts application after export database')
    start_application()
    process.exit(0);
  } catch (err) {
    console.log(err);
    shell.echo(err)
    process.exit(1);
  }
 
}

module.exports = {runExportDatabase: main};
