const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');

const shell = require('shelljs');

const utils = require('./utils');
const Constants = require('./constants');
const logger = require('./logger');
const mailer = require('./mailer');

const command_args = process.argv.slice(3);

async function run() {

  const timestamp = new Date().toISOString().replace(/:/g, '-')
  let errorCode = 0;
  try {
    const check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1';
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

    utils.stop(['backend', 'rts']);

    console.log('Available free space at /appsmith-stacks');
    const availSpaceInBytes = parseInt(shell.exec('df --output=avail -B 1 /appsmith-stacks | tail -n 1'), 10);
    console.log('\n');

    if (availSpaceInBytes < Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES) {
      throw new Error('Not enough space avaliable at /appsmith-stacks. Please ensure availability of atleast 5GB to backup successfully.');
    }

    const backupRootPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'appsmithctl-backup-'));
    const backupContentsPath = backupRootPath + '/appsmith-backup-' + timestamp;

    await fsPromises.mkdir(backupContentsPath);

    await exportDatabase(backupContentsPath);

    await createGitStorageArchive(backupContentsPath);

    await createManifestFile(backupContentsPath);
    await exportDockerEnvFile(backupContentsPath);

    const archivePath = await createFinalArchive(backupRootPath, timestamp);

    await fsPromises.rm(backupRootPath, { recursive: true, force: true });

    console.log('Finished taking a backup at', archivePath);
    await postBackupCleanup();

  } catch (err) {
    errorCode = 1;
    await logger.backup_error(err.stack);

    if (command_args.includes('--error-mail')) {
      const currentTS = new Date().getTime();
      const lastMailTS = await utils.getLastBackupErrorMailSentInMilliSec();
      if ((lastMailTS + Constants.DURATION_BETWEEN_BACKUP_ERROR_MAILS_IN_MILLI_SEC) < currentTS){
        await mailer.sendBackupErrorToAdmins(err, timestamp);
        await utils.updateLastBackupErrorMailSentInMilliSec(currentTS);
      }
    }
  } finally {
    utils.start(['backend', 'rts']);
    process.exit(errorCode);

  }
}

async function exportDatabase(destFolder) {
  console.log('Exporting database');
  await utils.execCommand(['mongodump', `--uri=${process.env.APPSMITH_MONGODB_URI}`, `--archive=${destFolder}/mongodb-data.gz`, '--gzip']);
  console.log('Exporting database done.');
}

async function createGitStorageArchive(destFolder) {
  console.log('Creating git-storage archive');

  let gitRoot = process.env.APPSMITH_GIT_ROOT;
  if (gitRoot == null || gitRoot === '') {
    gitRoot = '/appsmith-stacks/git-storage';
  }

  await utils.execCommand(['ln', '-s', gitRoot, destFolder + '/git-storage'])

  console.log('Created git-storage archive');
}

async function createManifestFile(path) {
  const content = await fsPromises.readFile('/opt/appsmith/rts/version.js', { encoding: 'utf8' });
  const version = content.match(/\bexports\.VERSION\s*=\s*["']([^"]+)["']/)[1];
  const manifest_data = { "appsmithVersion": version }
  await fsPromises.writeFile(path + '/manifest.json', JSON.stringify(manifest_data));
}

async function exportDockerEnvFile(destFolder) {
  console.log('Exporting docker environment file');
  const content = await fsPromises.readFile('/appsmith-stacks/configuration/docker.env', { encoding: 'utf8' });
  const output_lines = []
  content.split(/\r?\n/).forEach(line => {
    if (!line.startsWith("APPSMITH_ENCRYPTION")) {
      output_lines.push(line)
    }
  });
  await fsPromises.writeFile(destFolder + '/docker.env', output_lines.join('\n'));
  console.log('Exporting docker environment file done.');

  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!! Important !!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('!!! Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file because those values are not included in the backup export.');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
}

async function createFinalArchive(destFolder, timestamp) {
  console.log('Creating final archive');

  const archive = `${Constants.BACKUP_PATH}/appsmith-backup-${timestamp}.tar.gz`;
  await utils.execCommand(['tar', '-cah', '-C', destFolder, '-f', archive, '.']);

  console.log('Created final archive');

  return archive;
}

async function postBackupCleanup(){
  console.log('Starting the cleanup task after taking a backup.');
  let backupArchivesLimit = process.env.APPSMITH_BACKUP_ARCHIVE_LIMIT;
  if(!backupArchivesLimit)
    backupArchivesLimit = 4;
  const backupFiles = await utils.listLocalBackupFiles();
  while (backupFiles.length > backupArchivesLimit){
    const fileName = backupFiles.shift();
    await fsPromises.rm(Constants.BACKUP_PATH + '/' + fileName);
  }
  console.log('Cleanup task completed.');

}

module.exports = {
  run,
};
