import fs from "fs-extra";

const createImportListString = (name: string, dir: string) => {
  return `export { ${name} } from "./components/${dir}/${name}";
`;
};

async function generateIndex() {
  await appendExports("Thumbnails");
  await appendExports("Icons");
  await appendExports("CustomIcons");

  // eslint-disable-next-line no-console
  console.error(
    "\x1b[32mIndex.ts file generation completed successfully!\x1b[0m",
  );
}

async function appendExports(dir: string) {
  await fs.readdir(`./src/components/${dir}/`, async (err, files) => {
    if (err) {
      // eslint-disable-next-line no-console
      return console.error(err);
    }

    let importList = ``;

    files.forEach((file) => {
      const name = file.replace(".tsx", "");

      importList += createImportListString(name, dir);
    });

    await fs.appendFile(`./src/index.ts`, importList, "utf8", function (err) {
      if (err) {
        // eslint-disable-next-line no-console
        return console.error(err);
      }
    });
  });
}

generateIndex();
