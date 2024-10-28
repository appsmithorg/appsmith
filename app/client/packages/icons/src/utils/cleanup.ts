import fs from "fs-extra";

async function cleanup() {
  await fs.emptyDir("./src/icons/Icons");
  await fs.emptyDir("./src/icons/Thumbnails");
  await fs.emptyDir("./src/icons/CustomIcons");
  await fs.emptyDir("./src/components/Icons");
  await fs.emptyDir("./src/components/Thumbnails");
  await fs.emptyDir("./src/components/CustomIcons");
  await fs.emptyDir("./src/stories");
  await fs.writeFile(`./src/index.ts`, "");
}

cleanup();
