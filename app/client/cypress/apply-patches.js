const { getVersionDir } = require("cypress/lib/tasks/state");
const chalk = require("chalk");
const Diff = require("diff");
const fs = require("fs/promises");
const path = require("path");

async function applyPatches() {
  const patchesDir = path.join("patches");
  const patchesAbsDir = path.join(process.cwd(), patchesDir);
  const patches = await fs.readdir(patchesAbsDir);
  const installDir = getVersionDir();

  console.log(`\n> Applying patches on to ${chalk.cyan(installDir)}\n`);

  for (const filename of patches) {
    if (!filename.endsWith(".patch")) {
      continue;
    }
    const fullpath = path.join(patchesAbsDir, filename);
    const enc = "utf8";
    const patch = await fs.readFile(fullpath, enc);
    const relativeFilename = path.join(patchesDir, filename);
    console.log(`>> Applying patch ${chalk.cyan(relativeFilename)}`);
    await Diff.applyPatches(patch, {
      loadFile: (index, callback) => {
        console.debug(`>>> Loading old file: ${chalk.red(index.oldFileName)}`);
        fs.readFile(path.join(installDir, index.oldFileName), enc)
          .then((contents) => {
            callback(null, contents);
          })
          .catch(callback);
      },
      patched: (index, content, callback) => {
        console.debug(
          `>>> Patched new file: ${chalk.green(index.newFileName)}`,
        );
        fs.writeFile(path.join(installDir, index.newFileName), content, enc)
          .then(callback)
          .catch(callback);
      },
      complete: () => {
        console.log(
          `>> Successfully applied patch ${chalk.cyan(relativeFilename)}`,
        );
      },
    });
  }
}

applyPatches().catch((e) => {
  console.error(e);
  process.exit(42);
});
