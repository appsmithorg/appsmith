const AWS = require("aws-sdk");
var fs = require("fs");
const path = require("path");

AWS.config.update({ region: "us-east-2" });
const key = process.env.APPSMITH_PERFORMANCE_S3_KEY;
const secret = process.env.APPSMITH_PERFORMANCE_S3_SECRET;

const BUCKET_NAME = "performance-infra-artifacts-appsmith";
// Create S3 service object
const s3 = new AWS.S3({
  accessKeyId: key,
  secretAccessKey: secret,
});

uploadFiles = async () => {
  const start = performance.now();
  if (!process.env.CI) {
    console.log("Not running on CI, exiting");
    return;
  }
  console.log("Uploading source maps");

  const files = fs.readdirSync("./build/static/js/");
  const promises = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.endsWith("js.map")) {
      console.log(file);

      // upload to s3
      const inputStream = fs.createReadStream(
        path.join(__dirname, `build/static/js/${file}`),
      );

      const params = {
        Key: `source-maps/${file}`,
        Body: inputStream,
        Bucket: BUCKET_NAME,
      };

      promises.push(s3.upload(params).promise());
    }
  }
  await Promise.all(promises);

  const end = performance.now();
  console.log(`Source maps uploaded in ${end - start}ms`);
};

try {
  uploadFiles();
} catch (e) {
  console.log(e);
}
