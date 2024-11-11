const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const readlineSync = require('readline-sync');

const shell = require('shelljs');

const utils = require('./utils');
const Constants = require('./constants');
const command_args = process.argv.slice(3);
const {getCurrentAppsmithVersion} = require("./utils")

async function getBackupFileName() {

  const backupFiles = await utils.listLocalBackupFiles();
  console.log("\n" + backupFiles.length + " Appsmith backup file(s) found: [Sorted in ascending/chronological order]");
  if (backupFiles.length == 0) {
    return;
  }
  console.log('----------------------------------------------------------------');
  console.log('Index\t|\tAppsmith Backup Archive File');
  console.log('----------------------------------------------------------------');
  for (let i = 0; i < backupFiles.length; i++) {
    if (i === backupFiles.length - 1)
      console.log(i + '\t|\t' + backupFiles[i] + ' <--Most recent backup');
    else
      console.log(i + '\t|\t' + backupFiles[i]);
  }
  console.log('----------------------------------------------------------------');

  const backupFileIndex = parseInt(readlineSync.question('Please enter the backup file index: '), 10);
  if (!isNaN(backupFileIndex) && Number.isInteger(backupFileIndex) && (backupFileIndex >= 0) && (backupFileIndex < backupFiles.length)) {
    return backupFiles[parseInt(backupFileIndex, 10)];
  }
  else {
    console.log('Invalid input, please try the command again with a valid option');
  }
}

async function decryptArchive(encryptedFilePath, backupFilePath){
  console.log('Enter the password to decrypt the backup archive:')
  for (const _ of [1, 2, 3]) {
    const decryptionPwd = readlineSync.question('', { hideEchoBack: true });
    try{
      await utils.execCommandSilent(['openssl', 'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', 100000, '-in', encryptedFilePath, '-out', backupFilePath, '-k', decryptionPwd])
      return true
    } catch (error) {
      console.log('Invalid password. Please try again:');
    }
  }
  return false
}

async function extractArchive(backupFilePath, restoreRootPath) {
  console.log('Extracting the Appsmith backup archive at ' + backupFilePath);
  await utils.execCommand(['tar', '-C', restoreRootPath, '-xf', backupFilePath]);
  console.log('Extracting the backup archive completed');
}

async function restoreDatabase(restoreContentsPath, dbUrl) {
  console.log('Restoring database...');
  if (dbUrl.startsWith('mongodb')) {
    await restore_mongo_db(restoreContentsPath, dbUrl);
  } else if (dbUrl.includes('postgresql')) {
    await restore_postgres_db(restoreContentsPath, dbUrl);
  }
  console.log('Restoring database completed');
}

async function restore_mongo_db(restoreContentsPath, dbUrl) {
  const cmd = ['mongorestore', `--uri=${dbUrl}`, '--drop', `--archive=${restoreContentsPath}/mongodb-data.gz`, '--gzip']
  try {
    const fromDbName = await getBackupDatabaseName(restoreContentsPath);
    const toDbName = utils.getDatabaseNameFromDBURI(dbUrl);
    console.log("Restoring database from " + fromDbName + " to " + toDbName)
    cmd.push('--nsInclude=*', `--nsFrom=${fromDbName}.*`, `--nsTo=${toDbName}.*`)
  } catch (error) {
    console.warn('Error reading manifest file. Assuming same database name.', error);
  }
  await utils.execCommand(cmd);
}

async function restore_postgres_db(restoreContentsPath, dbUrl) {
  const cmd = ['pg_restore', '-U', 'postgres', '-c', `${restoreContentsPath}/pg-data.archive`];
  try {
    const toDbName = utils.getDatabaseNameFromDBURI(dbUrl);
    console.log("Restoring database to " + toDbName);
    cmd.push('-d' , toDbName);
  } catch (error) {
    console.warn('Error reading manifest file. Assuming same database name.', error);
  }
  await utils.execCommand(cmd);
}

async function restoreDockerEnvFile(restoreContentsPath, backupName, overwriteEncryptionKeys) {
  console.log('Restoring docker environment file');
  const dockerEnvFile = '/appsmith-stacks/configuration/docker.env';
  const updatedbUrl = utils.getDburl();
  let encryptionPwd = process.env.APPSMITH_ENCRYPTION_PASSWORD;
  let encryptionSalt = process.env.APPSMITH_ENCRYPTION_SALT;
  await utils.execCommand(['mv', dockerEnvFile, dockerEnvFile + '.' + backupName]);
  await utils.execCommand(['cp', restoreContentsPath + '/docker.env', dockerEnvFile]);
  if (overwriteEncryptionKeys){
    if (encryptionPwd && encryptionSalt) {
      const input = readlineSync.question('If you are restoring to the same Appsmith deployment which generated the backup archive, you can use the existing encryption keys on the instance.\n\
      Press Enter to continue with existing encryption keys\n\
      Or Type "n"/"No" to provide encryption key & password corresponding to the original Appsmith instance that is being restored.\n');
      const answer = input && input.toLocaleUpperCase();
      if (answer === 'N' || answer === 'NO') {
        encryptionPwd = readlineSync.question('Enter the APPSMITH_ENCRYPTION_PASSWORD: ', {
          hideEchoBack: true
        });
        encryptionSalt = readlineSync.question('Enter the APPSMITH_ENCRYPTION_SALT: ', {
          hideEchoBack: true
        });
      }
      else {
        console.log('Restoring docker environment file with existing encryption password & salt');
      }
    }
    else {
      encryptionPwd = readlineSync.question('Enter the APPSMITH_ENCRYPTION_PASSWORD: ', {
        hideEchoBack: true
      });
      encryptionSalt = readlineSync.question('Enter the APPSMITH_ENCRYPTION_SALT: ', {
        hideEchoBack: true
      });
    }
    await fsPromises.appendFile(dockerEnvFile, '\nAPPSMITH_ENCRYPTION_PASSWORD=' + encryptionPwd + '\nAPPSMITH_ENCRYPTION_SALT=' + encryptionSalt + '\nAPPSMITH_DB_URL=' + utils.getDburl() +
    '\nAPPSMITH_MONGODB_USER=' + process.env.APPSMITH_MONGODB_USER + '\nAPPSMITH_MONGODB_PASSWORD=' + process.env.APPSMITH_MONGODB_PASSWORD ) ;
    } else {
    await fsPromises.appendFile(dockerEnvFile, '\nAPPSMITH_DB_URL=' + updatedbUrl +
    '\nAPPSMITH_MONGODB_USER=' + process.env.APPSMITH_MONGODB_USER + '\nAPPSMITH_MONGODB_PASSWORD=' + process.env.APPSMITH_MONGODB_PASSWORD ) ;
    }
    console.log('Restoring docker environment file completed');
}

async function restoreGitStorageArchive(restoreContentsPath, backupName) {
  console.log('Restoring git-storage archive');
  // TODO: Consider APPSMITH_GIT_ROOT env for later iterations
  const gitRoot = '/appsmith-stacks/git-storage';
  await utils.execCommand(['mv', gitRoot, gitRoot + '-' + backupName]);
  await utils.execCommand(['mv', restoreContentsPath + '/git-storage', '/appsmith-stacks']);
  console.log('Restoring git-storage archive completed');

}

async function checkRestoreVersionCompatability(restoreContentsPath) {
  const currentVersion = await getCurrentAppsmithVersion();
  const manifest_data = await fsPromises.readFile(restoreContentsPath + '/manifest.json', { encoding: 'utf8' });
  const manifest_json = JSON.parse(manifest_data);
  const restoreVersion = manifest_json["appsmithVersion"];
  console.log('Current Appsmith Version: ' + currentVersion);
  console.log('Restore Appsmith Version: ' + restoreVersion);

  if (currentVersion === restoreVersion) {
    console.log('The restore instance is compatible with the current appsmith version');
  } else {
    console.log('**************************** WARNING ****************************');
    console.log('The Appsmith instance to be restored is not compatible with the current version.');
    console.log('Please update your appsmith image to \"index.docker.io/appsmith/appsmith-ce:' + restoreVersion +
      '\" in the \"docker-compose.yml\" file\nand run the cmd: \"docker-compose restart\" ' +
      'after the restore process is completed, to ensure the restored instance runs successfully.');
    const confirm = readlineSync.question('Press Enter to continue \nOr Type "c" to cancel the restore process.\n');
    if (confirm.toLowerCase() === 'c') {
      process.exit(0);
    }
  }
}

async function getBackupDatabaseName(restoreContentsPath) {
  let db_name = "appsmith"
  if (command_args.includes('--backup-db-name')) {
    for (let i = 0; i < command_args.length; i++) {
      if (command_args[i].startsWith('--backup-db-name')) {
        db_name = command_args[i].split("=")[1];
      }
    }
  }
  else {
    const manifest_data = await fsPromises.readFile(restoreContentsPath + '/manifest.json', { encoding: 'utf8' });
    const manifest_json = JSON.parse(manifest_data);
    if ("dbName" in manifest_json){
      db_name = manifest_json["dbName"];
    }
  }

  console.log('Backup Database Name: ' + db_name);
  return db_name
}

async function run() {
  let errorCode = 0;
  let cleanupArchive = false;
  let overwriteEncryptionKeys = true;
  let backupFilePath;
  try {
    shell.exec('/usr/bin/supervisorctl >/dev/null 2>&1', function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

    let backupFileName = await getBackupFileName();
    if (backupFileName == null) {
      process.exit(errorCode);
    } else {
      backupFilePath = path.join(Constants.BACKUP_PATH, backupFileName);
      if (isArchiveEncrypted(backupFileName)){
        const encryptedBackupFilePath = path.join(Constants.BACKUP_PATH, backupFileName);
        backupFileName = backupFileName.replace('.enc', '');
        backupFilePath = path.join(Constants.BACKUP_PATH, backupFileName);
        cleanupArchive = true;
        overwriteEncryptionKeys = false;
        const decryptSuccess = await decryptArchive(encryptedBackupFilePath, backupFilePath);
        if (!decryptSuccess){
          console.log('You have entered the incorrect password multiple times. Aborting the restore process.')
          await fsPromises.rm(backupFilePath, { force: true });
          process.exit(errorCode)
        }
      }
      const backupName = backupFileName.replace(/\.tar\.gz$/, "");
      const restoreRootPath = await fsPromises.mkdtemp(os.tmpdir());
      const restoreContentsPath = path.join(restoreRootPath, backupName);

      await extractArchive(backupFilePath, restoreRootPath);
      await checkRestoreVersionCompatability(restoreContentsPath);

      console.log('****************************************************************');
      console.log('Restoring Appsmith instance from the backup at ' + backupFilePath);
      utils.stop(['backend', 'rts']);
      await restoreDatabase(restoreContentsPath, utils.getDburl());
      await restoreDockerEnvFile(restoreContentsPath, backupName, overwriteEncryptionKeys);
      await restoreGitStorageArchive(restoreContentsPath, backupName);
      console.log('Appsmith instance successfully restored.');
      await fsPromises.rm(restoreRootPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.log(err);
    errorCode = 1;

  } finally {
    if (cleanupArchive){
      await fsPromises.rm(backupFilePath, { force: true });
    }
    utils.start(['backend', 'rts']);
    process.exit(errorCode);

  }
}

function isArchiveEncrypted(backupFilePath){
  return backupFilePath.endsWith('.enc');
}

module.exports = {
  run,
};
