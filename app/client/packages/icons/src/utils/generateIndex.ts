import fg from "fast-glob";
import type { PathLike } from "fs";
import fs from "fs-extra";
import path from "path";

const createIndexItem = (name: string, dir: string) => {
  return `export { ${name} } from "./components/${dir}/${name}";
`;
};

async function generateIndex() {
  const entries = await fg("./src/components/**/*.tsx");

  entries.map(async (filepath: PathLike) => {
    fs.readFile(filepath, "utf-8", (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        return console.error(err);
      }

      const dir = path
        .dirname(filepath as string)
        .replace("./src/components/", "");
      const name = path.basename(filepath as string).replace(".tsx", "");

      // Clearing the data in the file
      fs.writeFile(`./src/index.ts`, "");
      fs.appendFile(
        `./src/index.ts`,
        createIndexItem(name, dir),
        "utf8",
        function (err) {
          // eslint-disable-next-line no-console
          if (err) return console.error(err);
        },
      );
    });
  });

  // eslint-disable-next-line no-console
  console.error(
    "\x1b[32mIndex.ts file generation completed successfully!\x1b[0m",
  );
}

generateIndex();
