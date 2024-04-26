import fs from "fs-extra";

async function cleanup() {
  await fs.emptyDirSync("./src/icons/Icons");
  await fs.emptyDirSync("./src/icons/Thumbnails");
  await fs.emptyDirSync("./src/components/Icons");
  await fs.emptyDirSync("./src/components/Thumbnails");
  await fs.emptyDirSync("./src/stories");
  await fs.writeFile(`./src/index.ts`, "");
}

cleanup();
