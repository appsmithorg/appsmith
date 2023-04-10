const fs = require("fs");
const path = require("path");
const https = require("https");

const regex = /(?:\${ASSETS_CDN_URL}|https:\/\/assets\.appsmith\.com)[^`"]+/g;

const rootDir = [
  path.resolve(__dirname, "src"),
  path.join(path.resolve(__dirname, "../"), "server", "appsmith-server"),
];

function searchFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchFiles(filePath);
    } else if (stat.isFile() && path.extname(filePath) !== ".class") {
      // Skip .class files - server code
      const contents = fs.readFileSync(filePath, "utf8");
      const matches = contents.match(regex);
      if (matches) {
        console.log(`Found ${matches.length} matches in ${filePath}:`);
        const replacedMatches = matches.map((match) => {
          return match.replace(
            /\${ASSETS_CDN_URL}/,
            "https://assets.appsmith.com",
          );
        });
        replacedMatches.forEach((match) => {
          const filename = path.basename(match);
          const destPath = path.join(__dirname, "public", filename);
          if (fs.existsSync(destPath)) {
            console.log(`File already exists: ${filename}`);
            return;
          }
          console.log(`Downloading ${match} to ${destPath}...`);
          https.get(match, (response) => {
            if (response.statusCode === 200) {
              const fileStream = fs.createWriteStream(destPath);
              response.pipe(fileStream);
              fileStream.on("finish", () => {
                fileStream.close();
                console.log(`Downloaded ${match} to ${destPath}`);
              });
            } else {
              console.error(
                `Failed to download ${match}:`,
                response.statusCode,
              );
            }
          });
        });
      }
    }
  });
}

for (const dir of rootDir) {
  searchFiles(dir);
}
