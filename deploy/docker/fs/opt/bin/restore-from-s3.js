#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os"); // 👈 for cross-platform temp path

(async () => {
  const args = process.argv.slice(2);
  const s3Url = args[0];

  if (!s3Url || !s3Url.startsWith("s3://")) {
    console.error("❌ Please provide a valid S3 URL");
    process.exit(1);
  }

  console.log(`🧪 [FAKE MODE] Pretending to download from S3: ${s3Url}`);

  // Cross-platform safe temp file path
  const localFile = path.join(os.tmpdir(), "backup.tar.gz");

  try {
    // Simulate backup download
    fs.writeFileSync(localFile, "fake backup content");

    // Simulate restore call
    console.log(`🧪 [FAKE MODE] Calling: node index.js restore ${localFile}`);
    execSync(`echo Simulated mongorestore --gzip --archive=${localFile}`, {
      stdio: "inherit"
    });

    console.log("✅ Fake restore completed successfully.");
  } catch (err) {
    console.error("❌ Restore simulation failed:", err);
    process.exit(1);
  }
})();
