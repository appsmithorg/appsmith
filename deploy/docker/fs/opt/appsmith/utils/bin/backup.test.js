const backup = require('./backup');
const Constants = require('./constants');
const os = require('os');
const fsPromises = require('fs/promises');
const utils = require('./utils');
const readlineSync = require('readline-sync');

describe('Backup Tests', () => {

test('Timestamp string in ISO format', () => {
  console.log(backup.getTimeStampInISO())
  expect(backup.getTimeStampInISO()).toMatch(/(\d{4})-(\d{2})-(\d{2})T(\d{2})\-(\d{2})\-(\d{2})\.(\d{3})Z/)
});

test('Available Space in /appsmith-stacks volume in Bytes', async () => {
  const res = expect(await backup.getAvailableBackupSpaceInBytes("/"))
  res.toBeGreaterThan(1024 * 1024)
});

it('Checkx the constant is 2 GB', () => {
  let size = 2 * 1024 * 1024 * 1024
  expect(Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES).toBe(size)
});

it('Should throw Error when the available size is below MIN_REQUIRED_DISK_SPACE_IN_BYTES', () => {
  let size = Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES - 1;
  expect(() => backup.checkAvailableBackupSpace(size)).toThrow();
});

it('Should not hould throw Error when the available size is >= MIN_REQUIRED_DISK_SPACE_IN_BYTES', () => {
  expect(() => {backup.checkAvailableBackupSpace(Constants.MIN_REQUIRED_DISK_SPACE_IN_BYTES)}).not.toThrow('Not enough space avaliable at /appsmith-stacks. Please ensure availability of atleast 5GB to backup successfully.');
});

it('Generates t', async () => {
  os.tmpdir =  jest.fn().mockReturnValue('temp/dir');
  fsPromises.mkdtemp =  jest.fn().mockImplementation((a) => a);
  backup.generateBackupRootPath().then((response)=>{console.log(response)})
  const res = await backup.generateBackupRootPath()
  expect(res).toBe('temp/dir/appsmithctl-backup-')
});

test('Test backup contents path generation', () => {
  var root = '/rootDir'
  var timestamp = '0000-00-0T00-00-00.00Z'
  expect(backup.getBackupContentsPath(root, timestamp)).toBe('/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z')
});

test('Test mongodump CMD generaton', async () => {
  var dest = '/dest'
  var appsmithMongoURI = 'mongodb://username:password@host/appsmith'
  var cmd = 'mongodump --uri=mongodb://username:password@host/appsmith --archive=/dest/mongodb-data.gz --gzip'
  utils.execCommand =  jest.fn().mockImplementation(async (a) => a.join(' '));
  const res = await backup.executeMongoDumpCMD(dest, appsmithMongoURI)
  expect(res).toBe(cmd)
  console.log(res)
})

test('Test postgresdump CMD generaton', async () => {
  var dest = '/dest'
  var appsmithMongoURI = 'postgresql://username:password@host/appsmith'
  var cmd = 'pg_dump postgresql://username:password@host/appsmith -Fc -f /dest/pg-data.archive'
  utils.execCommand =  jest.fn().mockImplementation(async (a) => a.join(' '));
  const res = await backup.executePostgresDumpCMD(dest, appsmithMongoURI)
  expect(res).toBe(cmd)
  console.log(res)
})

test('Test get gitRoot path when APPSMITH_GIT_ROOT is \'\' ', () => {
  expect(backup.getGitRoot('')).toBe('/appsmith-stacks/git-storage')
});

test('Test get gitRoot path when APPSMITH_GIT_ROOT is null ', () => {
  expect(backup.getGitRoot()).toBe('/appsmith-stacks/git-storage')
});

test('Test get gitRoot path when APPSMITH_GIT_ROOT is defined ', () => {
  expect(backup.getGitRoot('/my/git/storage')).toBe('/my/git/storage')
});

test('Test ln command generation', async () => {
  var gitRoot = '/appsmith-stacks/git-storage'
  var dest = '/destdir'
  var cmd = 'ln -s /appsmith-stacks/git-storage /destdir/git-storage'
  utils.execCommand =  jest.fn().mockImplementation(async (a) => a.join(' '));
  const res = await backup.executeCopyCMD(gitRoot, dest)
  expect(res).toBe(cmd)
  console.log(res)
})

it('Checks for the current Appsmith Version.', async () => {
  fsPromises.readFile = jest.fn().mockImplementation(async (path) => {
    if (path === "/opt/appsmith/info.json") {
      return `{"version": "v0.0.0-SNAPSHOT"}`
    } else {
      throw new Error("Unexpected file to read: " + path)
    }
  });
  const res = await utils.getCurrentAppsmithVersion()
  expect(res).toBe("v0.0.0-SNAPSHOT")
})

test('If MONGODB and Encryption env values are being removed', () => {
  expect(backup.removeSensitiveEnvData(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_DB_URL=mongodb://appsmith:pass@localhost:27017/appsmith\nAPPSMITH_MONGODB_USER=appsmith\nAPPSMITH_MONGODB_PASSWORD=pass\nAPPSMITH_INSTANCE_NAME=Appsmith\n
  `)).toMatch(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_INSTANCE_NAME=Appsmith\n`)
});

test('If MONGODB and Encryption env values are being removed', () => {
  expect(backup.removeSensitiveEnvData(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_ENCRYPTION_PASSWORD=dummy-pass\nAPPSMITH_ENCRYPTION_SALT=dummy-salt\nAPPSMITH_DB_URL=mongodb://appsmith:pass@localhost:27017/appsmith\nAPPSMITH_MONGODB_USER=appsmith\nAPPSMITH_MONGODB_PASSWORD=pass\nAPPSMITH_INSTANCE_NAME=Appsmith\n
  `)).toMatch(`APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_INSTANCE_NAME=Appsmith\n`)
});


test('Backup Archive Limit when env APPSMITH_BACKUP_ARCHIVE_LIMIT is null', () => {
  expect(backup.getBackupArchiveLimit()).toBe(4)
});

test('Backup Archive Limit when env APPSMITH_BACKUP_ARCHIVE_LIMIT is 5', () => {
  expect(backup.getBackupArchiveLimit(5)).toBe(5)
});


test('Cleanup Backups when limit is 4 and there are 5 files', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1','file2','file3','file4','file5']
  var expectedBackupFiles =  ['file2','file3','file4','file5']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)

  expect(res).toEqual(expectedBackupFiles)
})

test('Cleanup Backups when limit is 2 and there are 5 files', async () => {
  const backupArchivesLimit = 2;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1','file2','file3','file4','file5']
  var expectedBackupFiles =  ['file4','file5']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)

  expect(res).toEqual(expectedBackupFiles)
})

test('Cleanup Backups when limit is 4 and there are 4 files', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1','file2','file3','file4']
  var expectedBackupFiles = ['file1','file2','file3','file4']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)

  expect(res).toEqual(expectedBackupFiles)
})

test('Cleanup Backups when limit is 4 and there are 2 files', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1','file2']
  var expectedBackupFiles = ['file1','file2']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)

  expect(res).toEqual(expectedBackupFiles)
})


test('Cleanup Backups when limit is 4 and there are 2 files', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1','file2']
  var expectedBackupFiles = ['file1','file2']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)
  expect(res).toEqual(expectedBackupFiles)
})


test('Cleanup Backups when limit is 2 and there is 1 file', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = ['file1']
  var expectedBackupFiles = ['file1']
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)
  expect(res).toEqual(expectedBackupFiles)
})

test('Cleanup Backups when limit is 2 and there is no file', async () => {
  const backupArchivesLimit = 4;
  fsPromises.rm = jest.fn().mockImplementation(async (a) => console.log(a));
  var backupFiles = []
  var expectedBackupFiles = []
  const res = await backup.removeOldBackups(backupFiles,backupArchivesLimit)
  console.log(res)
  expect(res).toEqual(expectedBackupFiles)
})


test('Test get encryption password from user prompt whene both passords are the same', async () => {
  const password = 'password#4321'
  readlineSync.question = jest.fn().mockImplementation((a) => {return password});
  const password_res = backup.getEncryptionPasswordFromUser()

  expect(password_res).toEqual(password)
})

test('Test get encryption password from user prompt when both passords are the different', async () => {
  const password = 'password#4321'
  readlineSync.question = jest.fn().mockImplementation((a) => {
    if (a=='Enter the above password again: '){
      return 'pass';
    }
    return password});
  const password_res = backup.getEncryptionPasswordFromUser()

  expect(password_res).toEqual(-1)
})

test('Get encrypted archive path', async () => {
  const archivePath = '/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z';
  const encryptionPassword = 'password#4321'
  utils.execCommand = jest.fn().mockImplementation( async (a) => console.log(a));
  const encArchivePath = await backup.encryptBackupArchive(archivePath, encryptionPassword)

  expect(encArchivePath).toEqual('/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z' + '.enc')
})

test('Test backup encryption function', async () => {
  utils.execCommand= jest.fn().mockImplementation(async (a) => console.log(a));
  const archivePath = '/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z'
  const encryptionPassword =  'password#123'
  const res = await backup.encryptBackupArchive(archivePath,encryptionPassword)
  console.log(res)
  expect(res).toEqual('/rootDir/appsmith-backup-0000-00-0T00-00-00.00Z.enc')
})
});

test('Get DB name from Mongo URI 1', async () => {
  var mongodb_uri = "mongodb+srv://admin:password@test.cluster.mongodb.net/my_db_name?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin"
  var expectedDBName = 'my_db_name'
  const dbName = utils.getDatabaseNameFromDBURI(mongodb_uri)
  expect(dbName).toEqual(expectedDBName)
})

test('Get DB name from Mongo URI 2', async () => {
  var mongodb_uri = "mongodb+srv://admin:password@test.cluster.mongodb.net/test123?retryWrites=true&minPoolSize=1&maxPoolSize=10&maxIdleTimeMS=900000&authSource=admin"
  var expectedDBName = 'test123'
  const dbName = utils.getDatabaseNameFromDBURI(mongodb_uri)
  expect(dbName).toEqual(expectedDBName)
})

test('Get DB name from Mongo URI 3', async () => {
  var mongodb_uri = "mongodb+srv://admin:password@test.cluster.mongodb.net/test123"
  var expectedDBName = 'test123'
  const dbName = utils.getDatabaseNameFromDBURI(mongodb_uri)
  expect(dbName).toEqual(expectedDBName)
})

test('Get DB name from Mongo URI 4', async () => {
  var mongodb_uri = "mongodb://appsmith:pAssW0rd!@localhost:27017/appsmith"
  var expectedDBName = 'appsmith'
  const dbName = utils.getDatabaseNameFromDBURI(mongodb_uri)
  expect(dbName).toEqual(expectedDBName)
})

test('Get DB name from PostgreSQL URI', async () => {
  var pg_uri = "postgresql://user:password@host:5432/postgres_db"
  var expectedDBName = 'postgres_db'
  const dbName = utils.getDatabaseNameFromDBURI(pg_uri)
  expect(dbName).toEqual(expectedDBName)
})

test('Get DB name from PostgreSQL URI with query params', async () => {
  var pg_uri = "postgresql://user:password@host:5432/postgres_db?sslmode=disable"
  var expectedDBName = 'postgres_db'
  const dbName = utils.getDatabaseNameFromDBURI(pg_uri)
  expect(dbName).toEqual(expectedDBName)
})

