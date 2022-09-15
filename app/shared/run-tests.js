const path = require("path");
const { exec } = require("child_process");
const { readdir, readFile } = require("fs/promises");
const { existsSync } = require("fs");

const CURRENT_DIRECTORY = path.join(__dirname, ".");

const EXCLUDED_DIRECTORIES = ["node_modules"];

const getDirectories = async (source) =>
  (await readdir(source, { withFileTypes: true }))
    .filter(
      (dirent) =>
        dirent.isDirectory() && !EXCLUDED_DIRECTORIES.includes(dirent.name)
    )
    .map((dirent) => dirent.name);

async function main() {
  const directories = await getDirectories(CURRENT_DIRECTORY);
  directories.map(async (directory) => {
    if (existsSync(`${CURRENT_DIRECTORY}/${directory}/package.json`)) {
      let packageJson = await readFile(`${CURRENT_DIRECTORY}/${directory}/package.json`);
      packageJson = JSON.parse(packageJson);
      if (packageJson.name?.startsWith("@shared") && packageJson.scripts?.hasOwnProperty("test:unit")) {
        exec(
          `
          cd ${CURRENT_DIRECTORY}/${directory};
          yarn install;
          yarn run test:unit;
        `,
          (err, stdout, stderr) => {
            if (err) {
              console.error(err);
              return;
            }

            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
          }
        );
      }
    }
  })
}

main();
