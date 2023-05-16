const prompts = require("prompts");
const { exec } = require("child_process");
const path = require("path");
const sharedJSON = require("./shared-dependencies.json");
const { existsSync } = require("fs");

const CURRENT_DIRECTORY = path.join(__dirname, '..');

function main() {
  console.log("\x1b[33m", "*******************************************");
  console.log("\x1b[33m", "Verifying Shared Dependencies");
  console.log("\x1b[33m", "*******************************************");

  prompts([
    {
      type: "select",
      name: "scope",
      message:
        "Pick an application to verify for installation of shared dependencies",
      choices: [
        { title: "Client", value: "client" },
        { title: "RTS", value: "rts" },
      ],
    }
  ]).then((values) => {
    const dependencies = sharedJSON[values.scope];
    if (dependencies && dependencies.length > 0) {
      console.log(`Installing all dependencies of ${values.scope} to verify shared dependencies`);
      exec(`
        cd ${CURRENT_DIRECTORY}/${values.scope};
        yarn install;
      `, (err) => {
        if (err) {
          console.log("\x1b[31m", `Unable to install packages for ${values.scope}`);
          return;
        }

        let basePath = `${CURRENT_DIRECTORY}/${values.scope}/node_modules`;
        const absentDep = [];
        dependencies.forEach((package) => {
          if (!existsSync(`${basePath}/${package}/package.json`)) {
            absentDep.push(package);
          }
        });
  
        if (absentDep.length > 0) {
          console.log("\x1b[31m", `Some shared dependencies are absent for ${values.scope} :`);
          absentDep.forEach((v) => {
            console.log("\x1b[33m", `${v} ❌`);
          })
        } else {
          console.log("\x1b[32m", "*******************************************");
          console.log("\x1b[32m", "All Shared Dependencies are verified successfully ✔");
          console.log("\x1b[32m", "*******************************************");
        }
      })
    } else {
      console.log("\x1b[34m", "*******************************************");
      console.log("\x1b[34m", `No Shared Dependency to verify installation in ${values.scope}`);
      console.log("\x1b[34m", "*******************************************");
    }
  });
}

main();
