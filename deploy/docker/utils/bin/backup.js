const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');

const shell = require('shelljs');

const utils = require('./utils');
const Constants = require('./constants');

 
async function run() {
  let errorCode = 0;
  try {
    const check_supervisord_status_cmd = '/usr/bin/supervisorctl >/dev/null 2>&1';
    shell.exec(check_supervisord_status_cmd, function (code) {
      if (code > 0) {
        shell.echo('application is not running, starting supervisord');
        shell.exec('/usr/bin/supervisord');
      }
    });

    console.log('Stopping backend & rts');
    utils.stop(['backend', 'rts']);

    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const backupRootPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'appsmithctl-backup-'));
    const backupContentsPath = backupRootPath + '/appsmith-backup-' + timestamp;

    await fsPromises.mkdir(backupContentsPath);

    await exportDatabase(backupContentsPath);

    await createGitStorageArchive(backupContentsPath);

    await writeVersion(backupContentsPath);
    await exportDockerEnvFile(backupContentsPath);

    const archivePath = await createFinalArchive(backupRootPath, timestamp);

    await fsPromises.rm(backupRootPath, {recursive: true, force: true});

    console.log('Starting backend & rts\n');

    console.log('Finished taking a baceup at', archivePath);
    // console.log('Please remember to also take the `docker.env` separately since it includes sensitive, but critical information.')

  } catch (err) {
    console.log(err);
    errorCode = 1;

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

async function writeVersion(path) {
  // TODO: Find a less fragile way do get the version here.
  const content = await fsPromises.readFile('/opt/appsmith/rts/version.js', {encoding: 'utf8'});
  const version = content.match(/\bexports\.VERSION\s*=\s*["']([^"]+)["']/)[1];
  await fsPromises.writeFile(path + '/version.txt', version);
  // shell.exec(`awk -F '=' '/^exports.VERSION/{print $NF}' /opt/appsmith/rts/version.js | sed 's/[;'\\''\\" ]//g' | tail -n 1 > ${path}/version.js`)
}

async function exportDockerEnvFile(destFolder) {
  console.log('Exporting docker environment file');
  // shell.exec(`sed '/^APPSMITH_ENCRYPTION.*/d' /appsmith-stacks/configuration/docker.env > ${destFolder}/docker.env`);
  const content = await fsPromises.readFile('/appsmith-stacks/configuration/docker.env', {encoding: 'utf8'});
  const output_lines = []
  content.split(/\r?\n/).forEach(line =>  {
    if (!(line.startsWith("APPSMITH_ENCRYPTION")))
      output_lines.push(line)
 });
  await fsPromises.writeFile(destFolder + '/docker.env', output_lines.join('\n'));
  console.log('Exporting docker environment file done.');

  console.log('Please ensure you have saved the APPSMITH_ENCRYPTION_SALT and APPSMITH_ENCRYPTION_PASSWORD variables from the docker.env file because those values are not included in the backup export.')
}

async function createFinalArchive(destFolder, timestamp) {
  console.log('Creating final archive');

  const archive = `${Constants.BACKUP_PATH}/appsmith-backup-${timestamp}.tar.gz`;
  await utils.execCommand(['tar', '-cah', '-C', destFolder, '-f', archive, '.']);

  console.log('Created final archive');

  return archive;
}

module.exports = {
  run,
};
