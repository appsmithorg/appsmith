const fs = require("fs");
const path = require("path");
const readline = require("readline");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Please provide a file path and TAG as CLI arguments");
  process.exit(1);
}

const TAG = args[1];

function processFile(filePath) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let newFileContent = "";

  rl.on("line", (line) => {
    if (line.trim().startsWith("describe(")) {
      const startIndex = line.indexOf("(");
      const endIndex = line.lastIndexOf(",");
      const firstStringParam = line.substring(startIndex + 1, endIndex);

      if (line.includes("{ tags: ")) {
        const tagsStartIndex = line.indexOf("{ tags: [") + 9;
        const tagsEndIndex = line.indexOf("] }");
        const existingTags = line.substring(tagsStartIndex, tagsEndIndex);
        const updatedTags = `${existingTags}, "${TAG}"`;
        const updatedLine = line.replace(existingTags, updatedTags);
        newFileContent += updatedLine + "\n";
      } else {
        const updatedLine = line.replace(
          firstStringParam,
          `${firstStringParam}, { tags: ["${TAG}"] }`,
        );
        newFileContent += updatedLine + "\n";
      }
    } else {
      newFileContent += line + "\n";
    }
  });

  rl.on("close", () => {
    fs.writeFileSync(filePath, newFileContent);
  });
}

function processDirectory(directory) {
  fs.readdirSync(directory).forEach((file) => {
    let fullPath = path.join(directory, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (
      path.extname(fullPath) === ".js" ||
      path.extname(fullPath) === ".ts"
    ) {
      processFile(fullPath);
    }
  });
}

processDirectory(args[0]);
