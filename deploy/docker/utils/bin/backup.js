const fsPromises = require('fs/promises');
const fs = require('fs');
const path = require('path');
const os = require('os');
const shell = require('shelljs');
const utils = require('./utils');
const Constants = require('./constants');
const logger = require('./logger');
const mailer = require('./mailer');

const aws = require('./aws');
const command_args = process.argv.slice(3);

async function run() {
  const timestamp = getTimeStampInISO();
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
    const availSpaceInBytes = getAvailableBackupSpaceInBytes();
    console.log('\n');

    checkAvailableBackupSpace(availSpaceInBytes);

    const backupRootPath = await generateBackupRootPath();
    const backupContentsPath = getBackupContentsPath(backupRootPath, timestamp);

    await fsPromises.mkdir(backupContentsPath);

    await exportDatabase(backupContentsPath);

    await createGitStorageArchive(backupContentsPath);

    await createManifestFile(backupContentsPath);
    await exportDockerEnvFile(backupContentsPath);

    const archivePath = await createFinalArchive(backupRootPath, timestamp);

    await fsPromises.rm(backupRootPath, { recursive: true, force: true });

    logger.backup_info('Finished taking a backup at' + archivePath);


    if (command_args.includes('--upload-to-s3')){
      await aws.uploadArchiveToS3Bucket(archivePath);
      const oldArchivePaths = []
      await fsPromises.readdir(Constants.BACKUP_PATH).then(filenames => {
        for (let filename of filenames) {
          if (filename.match(/^appsmith-backup-.*\.tar\.gz$/)) {
            const filePath = Constants.BACKUP_PATH + '/' + filename;
            if (filePath !== archivePath){
              oldArchivePaths.push(filePath)
            }
            }}}).catch(err => {
              console.log(err);
          });
      for(let filepath of oldArchivePaths){
        console.log('Deleteing: ' + filepath)
        await fsPromises.rm(filepath);
      }
    }
    else{
      await postBackupCleanup();
    }

  } catch (err) {
    errorCode = 1;
    if (err.message == Constants.S3_UPLOAD_FAILED_ERROR_MSG) { // Fail safe if aws credentials are not configured, so that watchtower hook continues execution
      errorCode = 0;
    }
    
    await logger.backup_error(err.stack);

    if (command_args.includes('--error-mail')) {
      const currentTS = new Date().getTime();
      const lastMailTS = await utils.getLastBackupErrorMailSentInMilliSec();
      if ((lastMailTS + Constants.DURATION_BETWEEN_BACKUP_ERROR_MAILS_IN_MILLI_SEC) < currentTS) {
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
  await executeMongoDumpCMD(destFolder, process.env.APPSMITH_MONGODB_URI)
  console.log('Exporting database done.');
}

async function createGitStorageArchive(destFolder) {
  console.log('Creating git-storage archive');

  const gitRoot = getGitRoot(process.env.APPSMITH_GIT_ROOT);

  await executeCopyCMD(gitRoot, destFolder)

  console.log('Created git-storage archive');
}

async function createManifestFile(path) {
  const version = await utils.getCurrentAppsmithVersion()
  const manifest_data = { "appsmithVersion": version }
  await fsPromises.writeFile(path + '/manifest.json', JSON.stringify(manifest_data));
}

async function exportDockerEnvFile(destFolder) {
  console.log('Exporting docker environment file');
  const content = await fsPromises.readFile('/appsmith-stacks/configuration/docker.env', { encoding: 'utf8' });
  const cleaned_content = removeEncryptionEnvData(content)
  await fsPromises.writeFile(destFolder + '/docker.env', cleaned_content);
  console.log('Exporting docker environment file done.');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!! Important !!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('!!! Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file because those values are not included in the backup export.');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
}

async function executeMongoDumpCMD(destFolder, appsmithMongoURI) {
  return await utils.execCommand(['mongodump', `--uri=${appsmithMongoURI}`, `--archive=${destFolder}/mongodb-data.gz`, '--gzip']);// generate cmd
}

async function createFinalArchive(destFolder, timestamp) {
  console.log('Creating final archive');

  const archive = `${Constants.BACKUP_PATH}/appsmith-backup-${timestamp}.tar.gz`;
  await utils.execCommand(['tar', '-cah', '-C', destFolder, '-f', archive, '.']);

  console.log('Created final archive');

  return archive;
}

async function postBackupCleanup() {
  console.log('Starting the cleanup task after taking a backup.');
  let backupArchivesLimit = getBackupArchiveLimit(process.env.APPSMITH_BACKUP_ARCHIVE_LIMIT);
  const backupFiles = await utils.listLocalBackupFiles();
  while (backupFiles.length > backupArchivesLimit) {
    const fileName = backupFiles.shift();
    await fsPromises.rm(Constants.BACKUP_PATH + '/' + fileName);
  }
  console.log('Cleanup task completed.');

}
async function executeCopyCMD(srcFolder, destFolder) {
  return await utils.execCommand(['ln', '-s', srcFolder, destFolder + '/git-storage'])
}

function getGitRoot(gitRoot) {
  if (gitRoot == null || gitRoot === '') {
    gitRoot = '/appsmith-stacks/git-storage';
  }
  return gitRoot
}

async function generateBackupRootPath() {
  const backupRootPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'appsmithctl-backup-'));
  return backupRootPath
}

function getBackupContentsPath(backupRootPath, timestamp) {
  return backupRootPath + '/appsmith-backup-' + timestamp;
}

function removeEncryptionEnvData(content) {
  const output_lines = []
  content.split(/\r?\n/).forEach(line => {
    if (!line.startsWith("APPSMITH_ENCRYPTION")) {
      output_lines.push(line)
    }
  });
  return output_lines.join('\n')
}

function getBackupArchiveLimit(backupArchivesLimit) {
  if (!backupArchivesLimit)
    backupArchivesLimit = 4;
  return backupArchivesLimit
}

async function removeOldBackups(backupFiles, backupArchivesLimit) {
  while (backupFiles.length > backupArchivesLimit) {
    const fileName = backupFiles.shift();
    await fsPromises.rm(Constants.BACKUP_PATH + '/' + fileName);
  }
  return backupFiles
}

function getTimeStampInISO() {
  return new Date().toISOString().replace(/:/g, '-')
}

function getAvailableBackupSpaceInBytes() {
  return parseInt(shell.exec('df --output=avail -B 1 /appsmith-stacks | tail -n 1'), 10)
}

function checkAvailableBackupSpace(availSpaceInBytes) {
  if (availSpaceInBytes < Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES) {
    throw new Error('Not enough space avaliable at /appsmith-stacks. Please ensure availability of atleast 5GB to backup successfully.');
  }
}



module.exports = {
  run,
  getTimeStampInISO,
  getAvailableBackupSpaceInBytes,
  checkAvailableBackupSpace,
  generateBackupRootPath,
  getBackupContentsPath,
  executeMongoDumpCMD,
  getGitRoot,
  executeCopyCMD,
  removeEncryptionEnvData,
  getBackupArchiveLimit,
  removeOldBackups
};
