const shell = require('shelljs');
const childProcess = require('child_process');

function showHelp() {
  console.log('\nUsage: appsmith <command> to interactive with appsmith utils tool');
  console.log('\nOptions:\r');
  console.log('\tex, export_db\t\tExport interal database.\r');
  console.log('\tim, import_db\t\tImport interal database.\r');
  console.log('\tmi, migrate\t\tMigrate new server.\r');
  console.log('\tcrs, check_replica_set\t\tcheck replica set mongoDB.\r');
  console.log('\t--help\t\t\t' + 'Show help.' + '\t\t\t' + '[boolean]\n');
}

function stop(apps) {
  const appsStr = apps.join(' ')
  console.log('Stopping ' + appsStr);
  shell.exec('/usr/bin/supervisorctl stop ' + appsStr);
  console.log('Stopped ' + appsStr);
}

function start(apps) {
  const appsStr = apps.join(' ')
  console.log('Starting ' + appsStr);
  shell.exec('/usr/bin/supervisorctl start ' + appsStr);
  console.log('Started ' + appsStr);
}

function execCommand(cmd, options) {
  return new Promise((resolve, reject) => {
    let isPromiseDone = false;

    const p = childProcess.spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      ...options,
    });

    p.on('exit', (code) => {
      if (isPromiseDone) {
        return;
      }
      isPromiseDone = true;
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    })

    p.on('error', (err) => {
      if (isPromiseDone) {
        return;
      }
      isPromiseDone = true;
      log.error('Error rynning command', err);
      reject();
    })
  })
}

module.exports = {
  showHelp,
  start,
  stop,
  execCommand,
};
