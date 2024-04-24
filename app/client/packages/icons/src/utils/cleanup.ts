import fs from "fs-extra";

export function cleanup() {
  fs.emptyDirSync("./src/icons/Icons");
  fs.emptyDirSync("./src/icons/Thumbnails");
  fs.emptyDirSync("./src/components/Icons");
  fs.emptyDirSync("./src/components/Thumbnails");
}

cleanup();
