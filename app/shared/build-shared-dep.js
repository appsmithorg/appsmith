const { exec } = require("child_process");
const path = require("path");
const sharedJSON = require("./shared-dependencies.json");

const CURRENT_DIRECTORY = path.join(__dirname, '..');
const SCOPE_DIRECTORY = process.env.CURRENT_SCOPE;

async function main() {
  console.log("\x1b[33m", "*******************************************");
  console.log("\x1b[33m", "Bundling Shared Dependencies");
  console.log("\x1b[33m", "*******************************************");

  const dependencies = sharedJSON[SCOPE_DIRECTORY];

  if ((dependencies && dependencies.length > 0) || !SCOPE_DIRECTORY) {
    try {
      await Promise.all(
        dependencies.map(
          (dependencyFolder) =>
            new Promise((resolve, reject) => {
              console.log(
                "\x1b[0m",
                `Bundling Dependency for \x1b[34m${dependencyFolder}`
              );
              exec(
                `
            cd ${CURRENT_DIRECTORY}/${dependencyFolder.replace("@", "")};
            yarn unlink;
            yarn run link-package;
          `,
                (err) => {
                  if (err) {
                    reject(err);
                  }

                  console.log(
                    "\x1b[0m",
                    `Bundled Dependency for \x1b[34m${dependencyFolder}`
                  );
                  resolve();
                }
              );
            })
        )
      );
    } catch (error) {
      console.log(
        "\x1b[31m",
        "Error in Bundling Shared Dependencies ❌",
        error
      );
    }

    console.log("\x1b[32m", "*******************************************");
    console.log("\x1b[32m", "Done Bundling Shared Dependencies ✔");
    console.log("\x1b[32m", "*******************************************");
  } else {
    console.log("\x1b[34m", "*******************************************");
    console.log("\x1b[34m", "No Shared Dependency to bundle");
    console.log("\x1b[34m", "*******************************************");
  }
}

main();
