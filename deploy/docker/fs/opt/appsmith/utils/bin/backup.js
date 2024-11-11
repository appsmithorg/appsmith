const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const shell = require('shelljs');
const utils = require('./utils');
const Constants = require('./constants');
const logger = require('./logger');
const mailer = require('./mailer');
const tty = require('tty');
const readlineSync = require('readline-sync');

const command_args = process.argv.slice(3);

async function run() {
  const timestamp = getTimeStampInISO();
  let errorCode = 0;
  let backupRootPath, archivePath, encryptionPassword;
  let encryptArchive = false;
  try {
    const check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1';
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

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

    if (!command_args.includes('--non-interactive') && (tty.isatty(process.stdout.fd))){
      encryptionPassword = getEncryptionPasswordFromUser();
      if (encryptionPassword == -1){
        throw new Error('Backup process aborted because a valid enctyption password could not be obtained from the user');
      }
      encryptArchive = true;
    }
    await exportDockerEnvFile(backupContentsPath, encryptArchive);

    const archivePath = await createFinalArchive(backupRootPath, timestamp);
    // shell.exec("openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -in " + archivePath + " -out " + archivePath + ".enc");
    if (encryptArchive){
        const encryptedArchivePath = await encryptBackupArchive(archivePath,encryptionPassword);
        logger.backup_info('Finished creating an encrypted a backup archive at ' + encryptedArchivePath);
        if (archivePath != null) {
          await fsPromises.rm(archivePath, { recursive: true, force: true });
        }
    }
    else {
      logger.backup_info('Finished creating a backup archive at ' + archivePath);
      console.log('********************************************************* IMPORTANT!!! *************************************************************');
      console.log('*** Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file **')
      console.log('*** These values are not included in the backup export.                                                                           **');
      console.log('************************************************************************************************************************************');
    }

    await fsPromises.rm(backupRootPath, { recursive: true, force: true });

    logger.backup_info('Finished taking a backup at ' + archivePath);

  } catch (err) {
    errorCode = 1;
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
    if (backupRootPath != null) {
      await fsPromises.rm(backupRootPath, { recursive: true, force: true });
    }
    if (encryptArchive) {
      if (archivePath != null) {
        await fsPromises.rm(archivePath, { recursive: true, force: true });
      }
    }
    await postBackupCleanup();
    process.exit(errorCode);
  }
}

async function encryptBackupArchive(archivePath, encryptionPassword){
  const encryptedArchivePath = archivePath + '.enc';
  await utils.execCommand(['openssl', 'enc', '-aes-256-cbc', '-pbkdf2', '-iter', 100000, '-in', archivePath, '-out', encryptedArchivePath, '-k', encryptionPassword ])
  return encryptedArchivePath;
}

function getEncryptionPasswordFromUser(){
  for (const _ of [1, 2, 3])
  {
    const encryptionPwd1 = readlineSync.question('Enter a password to encrypt the backup archive: ', { hideEchoBack: true });
    const encryptionPwd2 = readlineSync.question('Enter the above password again: ', { hideEchoBack: true });
    if (encryptionPwd1 === encryptionPwd2){
       if (encryptionPwd1){
        return encryptionPwd1;
       }
       console.error("Invalid input. Empty password is not allowed, please try again.")
    }
    else {
      console.error("The passwords do not match, please try again.");
    }
  }
  console.error("Aborting backup process, failed to obtain valid encryption password.");
  return -1
}

async function exportDatabase(destFolder) {
  console.log('Exporting database');
  // Check the DB url
  if (utils.getDburl().startsWith('mongodb')) {
    await executeMongoDumpCMD(destFolder, utils.getDburl())
  } else if (utils.getDburl().startsWith('postgresql')) {
    await executePostgresDumpCMD(destFolder, utils.getDburl());
  }
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
  const manifest_data = { "appsmithVersion": version, "dbName": utils.getDatabaseNameFromDBURI(utils.getDburl()) }
  await fsPromises.writeFile(path + '/manifest.json', JSON.stringify(manifest_data));
}

async function exportDockerEnvFile(destFolder, encryptArchive) {
  console.log('Exporting docker environment file');
  const content = await fsPromises.readFile('/appsmith-stacks/configuration/docker.env', { encoding: 'utf8' });
  let cleaned_content = removeSensitiveEnvData(content);
  if (encryptArchive){
    cleaned_content += '\nAPPSMITH_ENCRYPTION_SALT=' + process.env.APPSMITH_ENCRYPTION_SALT +
    '\nAPPSMITH_ENCRYPTION_PASSWORD=' + process.env.APPSMITH_ENCRYPTION_PASSWORD
  }
  await fsPromises.writeFile(destFolder + '/docker.env', cleaned_content);
  console.log('Exporting docker environment file done.');
}

async function executeMongoDumpCMD(destFolder, appsmithMongoURI) {
  return await utils.execCommand(['mongodump', `--uri=${appsmithMongoURI}`, `--archive=${destFolder}/mongodb-data.gz`, '--gzip']);// generate cmd
}

async function executePostgresDumpCMD(destFolder, appsmithDBURI) {
  return await utils.execCommand(['pg_dump', appsmithDBURI, '-Fc', '-f', destFolder + '/pg-data.archive']);
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

function removeSensitiveEnvData(content) {
  // Remove encryption and Mongodb data from docker.env
  const output_lines = []
  content.split(/\r?\n/).forEach(line => {
    if (!line.startsWith("APPSMITH_ENCRYPTION") && !line.startsWith("APPSMITH_MONGODB") && !line.startsWith("APPSMITH_DB_URL=")) {
      output_lines.push(line);
    }
  });
  return output_lines.join('\n')
}

function getBackupArchiveLimit(backupArchivesLimit) {
  if (!backupArchivesLimit)
    backupArchivesLimit = Constants.APPSMITH_DEFAULT_BACKUP_ARCHIVE_LIMIT;
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
    throw new Error('Not enough space avaliable at /appsmith-stacks. Please ensure availability of atleast 2GB to backup successfully.');
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
  executePostgresDumpCMD,
  getGitRoot,
  executeCopyCMD,
  removeSensitiveEnvData,
  getBackupArchiveLimit,
  removeOldBackups,
  getEncryptionPasswordFromUser,
  encryptBackupArchive,
};