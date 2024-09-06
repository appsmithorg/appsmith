const { exec, execSync } = require("child_process");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");
const prompt = require("prompt-sync")();

function isContainerRunning(containerName) {
  try {
    const output = execSync(
      `docker ps --filter "name=^/${containerName}$" --format '{{.Names}}'`,
    );
    return output.length > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to execute commands and return a Promise
async function execCommand(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function checkDockerCompose() {
  try {
    execSync("docker-compose --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    console.error(
      "ERROR: docker-compose is not installed. Please install Docker Compose.",
    );
    process.exit(1);
  }
}

async function runLocalServer() {
  try {
    let user_input = prompt(
      `Do you wish to continue without setting up the local server with docker? (yes/no): `,
    );
    user_input = (user_input || "").trim().toLowerCase();

    if (user_input === "yes" || user_input === "y") {
      console.log(
        "INFO",
        "Continuing without setting up local backend docker based server.",
      );
    } else {
      // Adjust the path to point to the correct directory
      const dockerDir = path.join(__dirname, "../../../../deploy/docker");

      if (!existsSync(dockerDir)) {
        console.error(`ERROR: Directory ${dockerDir} does not exist.`);
        process.exit(1); // Exit if the directory is missing
      }

      await checkDockerCompose(); // Ensure Docker Compose is available

      console.log("INFO: Starting local server using Docker Compose...");
      execSync(`cd ${dockerDir} && pwd && docker-compose up -d`, {
        stdio: "inherit",
      });

      // Wait for the services to be fully up and running
      let servicesRunning = false;
      const maxRetries = 30;
      const retryInterval = 7000; // 7 seconds

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { stdout } = await execCommand("docker-compose ps", {
            cwd: dockerDir,
          });
          if (stdout.includes("Up")) {
            servicesRunning = true;
            break;
          }
        } catch (error) {
          console.error("ERROR: Error checking service status:", error.message);
          process.exit(1); // Exit if checking service status fails
        }
        console.log(
          `INFO: Waiting for services to be fully up and running... (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
      if (servicesRunning) {
        console.log("INFO: Local server is up and running.");
        return true;
      } else {
        console.error(
          "ERROR: Services did not become available within the expected time.",
        );
        process.exit(1); // Exit if services are not up
      }
    }
  } catch (error) {
    console.error("ERROR: Error starting local server:", error.message);
    process.exit(1); // Exit if starting local server fails
  }
}

function ensureTEDIsRunning() {
  // Check if TED is running. If not, then ask user if they wish to pull and run the TED container
  const isTedRunning = isContainerRunning("ted");

  if (isTedRunning) {
    console.log("INFO", "TED (TestEventDriver) is already running");
  } else {
    try {
      let user_input = prompt(
        "TED (TestEventDriver) is not running. Do you want to pull & run the latest Docker container for TED (TestEventDriver)? (yes/no): ",
      );
      user_input = user_input.trim().toLowerCase();
      switch (user_input) {
        case "yes":
        case "y":
          console.log(
            "INFO",
            "Running the Docker container for TED (TestEventDriver)",
          );
          try {
            execSync(
              "docker run --name ted --rm -d --pull always -p 2022:22 -p 5001:5001 -p 3306:3306 -p 28017:27017 -p 5433:5432 -p 25:25 -p 4200:4200 appsmith/test-event-driver",
              { stdio: "inherit" },
            );
            console.log(
              "INFO",
              "Please check https://github.com/appsmithorg/TestEventDriver for more details and functionalities of TED",
            );
          } catch (error) {
            console.error("ERROR", `Error installing TED: ${error.message}`);
          }
          break;
        case "no":
        case "n":
          console.log("INFO", "Proceeding without TED");
          break;
        default:
          console.log("ERROR", "Invalid input. Please enter yes or no.");
          process.exit(1);
      }
    } catch (error) {
      console.error("ERROR", `Error: ${error.message}`);
      process.exit(1);
    }
  }
}

async function checkIfAppsmithIsRunning(baseUrl) {
  // Check if appsmith is running. If it's not running, check if we want the user to continue without it.
  let isDevAppsmithAccessible;
  try {
    const response = await fetch(baseUrl);
    isDevAppsmithAccessible = response.ok;
  } catch (error) {
    console.error(
      "ERROR",
      `Error checking availability of dev.appsmith.com: ${error.message}`,
    );
    isDevAppsmithAccessible = false;
  }

  if (!isDevAppsmithAccessible) {
    let user_input = prompt(
      `https://dev.appsmith.com is not accessible. Do you wish to continue without setting it up? (yes/no): `,
    );
    user_input = user_input.trim().toLowerCase();
    switch (user_input) {
      case "yes":
      case "y":
        console.log("INFO", "Continuing without setting up dev.appsmith.com");
        break;
      case "no":
      case "n":
        process.exit(1);
      default:
        console.log("ERROR", "Invalid input. Please enter yes or no.");
        process.exit(1);
    }
  }
}

function getBaseUrl(repoRoot) {
  try {
    const cypressConfig = readFileSync(`${repoRoot}/cypress.config.ts`, "utf8");
    const baseUrlMatch = cypressConfig.match(/baseUrl\s*:\s*"([^"]+)"/);
    if (baseUrlMatch) {
      baseUrl = baseUrlMatch[1];
      console.log(
        "INFO",
        `Base url is ${baseUrl}. Please verify if it is correct. If not, please update it in cypress.config.ts file.`,
      );
      return baseUrl;
    } else {
      console.error(
        "ERROR",
        "Base url not found in cypress.config.ts. Please configure `baseUrl` property in cypress.config.ts file.",
      );
      process.exit(1);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("ERROR", "cypress.config.ts file not found");
    } else {
      console.error("ERROR", "Error reading cypress.config.ts file:", err);
    }
    process.exit(1);
  }
}

function ensureCypressEnvFileExists(repoRoot) {
  // Check if cypress.env.json file exists. If not, create it.
  const filePath = `${repoRoot}/cypress.env.json`;
  if (!existsSync(filePath)) {
    const testEnvData = {
      USERNAME: "testUser@test.com",
      PASSWORD: "testPass",
      TESTUSERNAME1: "viewerappsmith@test.com",
      TESTPASSWORD1: "viewerPass",
      TESTUSERNAME2: "developerappsmith@test.com",
      TESTPASSWORD2: "developerPass",
    };
    writeFileSync(filePath, JSON.stringify(testEnvData, null, 2));
    console.log("INFO", `${repoRoot}/cypress.env.json file created`);
  } else {
    console.log("INFO", `${repoRoot}/cypress.env.json file already exists`);
  }
}

async function setupCypress() {
  // Get the baseUrl from cypress.config.ts file
  let repoRoot = path.join(__dirname, "..", "..");
  let baseUrl = getBaseUrl(repoRoot);
  await runLocalServer();
  await checkIfAppsmithIsRunning(baseUrl);

  // Install Cypress using yarn install on the app/client repository
  console.log("INFO", "Installing Cypress..");
  try {
    execSync("yarn install", { cwd: `${repoRoot}` });
  } catch (error) {
    console.error("ERROR", `Error installing Cypress: ${error.message}`);
  }

  ensureCypressEnvFileExists(repoRoot);

  console.log(
    "INFO",
    "Please add APPSMITH_GIT_ROOT=./container-volumes/git-storage into server-side .env for running Git cases locally along with the server.",
  );

  ensureTEDIsRunning();

  console.log(
    "INFO",
    "Please start cypress using the command: npx cypress open",
  );
  console.log(
    "INFO",
    `In order to run single spec, please use the command: cd ${repoRoot} && npx cypress run --spec <specpath> --browser chrome`,
  );
  console.log(
    "INFO",
    "For more details check https://github.com/appsmithorg/appsmith/blob/master/contributions/ClientSetup.md#integration-tests",
  );
}

async function main() {
  await setupCypress();
  process.exit(0);
}

main();
