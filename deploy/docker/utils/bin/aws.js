
const fsPromises = require('fs/promises');
const Constants = require('./constants');
const { S3Client, ListObjectsCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3AccessKeyId = process.env.APPSMITH_BACKUP_S3_ACCESS_KEY;
const s3SecretAccessKey = process.env.APPSMITH_BACKUP_S3_SECRET_KEY;
const s3BucketName = process.env.APPSMITH_BACKUP_S3_BUCKET_NAME;
const s3Region = process.env.APPSMITH_BACKUP_S3_REGION;


function s3CredentialsExists() {
  return (s3AccessKeyId && s3SecretAccessKey && s3BucketName && s3Region)
}

async function listArchivesFromS3Bucket() {
  const backupFiles = [];
  if (s3CredentialsExists()) {
    const s3 = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey
      }
    });
    const params = {
      Bucket: s3BucketName,
      Prefix: 'appsmith-backup-'
    }
    const res = await s3.send(new ListObjectsCommand(params));
    for (let index = 0; index < res['Contents'].length; index++) {
      backupFiles.push(res['Contents'][index]['Key']);
    }
  }
  else {
    console.log('AWS S3 bucket credentials not found. Could not access backup archives in the bucket.');
  }
  return backupFiles;
}

async function uploadArchiveToS3Bucket(archivePath) {
  if (s3CredentialsExists()) {
    console.log('Uploading backup archive to S3 bucket ' + s3BucketName);
    const bucket = 'appsmithctl-backup-restore-test';
    const archiveName = archivePath.split('/').pop();
    const s3 = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey
      }
    });
    // Read content from the file
    const fileContent = await fsPromises.readFile(archivePath);

    // Setting up S3 upload parameters
    const params = {
      Bucket: s3BucketName,
      Key: archiveName, // File name you want to save as in S3
      Body: fileContent
    };
    // Uploading files to the bucket
    const response = await s3.send(new PutObjectCommand(params));
    console.log(response);
    console.log('Uploading backup archive to S3 bucket completed.');
  }
  else {
    throw new Error(Constants.S3_UPLOAD_FAILED_ERROR_MSG);
  }
}

async function downloadS3ArchiveFileTolocal(archiveName) {
  console.log('Downloading archive file ' + archiveName + ' from S3 bucket.');
  const params = {
    Bucket: s3BucketName,
    Key: archiveName, // File name you want to save as in S3
  };
  const s3 = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey
    }
  });
  const backupFilePath = Constants.BACKUP_PATH + '/' + archiveName;
  const data = await s3.send(new GetObjectCommand(params));
  await fsPromises.writeFile(backupFilePath, data.Body);
  console.log('Downloading archive file from S3 bucket completed.');
}

module.exports = {
  uploadArchiveToS3Bucket,
  listArchivesFromS3Bucket,
  downloadS3ArchiveFileTolocal,
};
