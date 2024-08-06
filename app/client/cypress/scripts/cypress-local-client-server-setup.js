const { execSync, exec } = require("child_process");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");
const prompt = require("prompt-sync")();

function isContainerRunning(containerName) {
  try {
    const output = execSync(`docker ps --format '{{.Names}}' | grep -w "${containerName}"`);
    return output.length > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to execute commands and return a Promise
function execCommand(command, options) {
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
    console.error("ERROR: docker-compose is not installed. Please install Docker Compose.");
    process.exit(1);
  }
}

async function runLocalServer() {
  try {
    // Adjust the path to point to the correct directory
    const dockerDir = path.join(__dirname, "../../../../deploy/docker");

    // Check if the directory exists
    if (!existsSync(dockerDir)) {
      console.error(`ERROR: Directory ${dockerDir} does not exist.`);
      process.exit(1); // Exit if the directory is missing
    }

    await checkDockerCompose(); // Ensure Docker Compose is available

    console.log("INFO: Starting local server using Docker Compose...");
    execSync(`cd ${dockerDir} && pwd && docker-compose up -d`, { stdio: "inherit" });

    // Wait for the services to be fully up and running
    let servicesRunning = false;
    const maxRetries = 30;
    const retryInterval = 7000; // 7 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { stdout } = await execCommand("docker-compose ps", { cwd: dockerDir });
        if (stdout.includes("Up")) {
          servicesRunning = true;
          break;
        }
      } catch (error) {
        console.error("ERROR: Error checking service status:", error.message);
        process.exit(1); // Exit if checking service status fails
      }
      console.log(`INFO: Waiting for services to be fully up and running... (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }

    if (servicesRunning) {
      console.log("INFO: Local server is up and running.");
      return true;
    } else {
      console.error("ERROR: Services did not become available within the expected time.");
      process.exit(1); // Exit if services are not up
    }
  } catch (error) {
    console.error("ERROR: Error starting local server:", error.message);
    process.exit(1); // Exit if starting local server fails
  }
}


function ensureTEDIsRunning() {
  const isTedRunning = isContainerRunning("ted");
  if (isTedRunning) {
    console.log("INFO", "TED (TestEventDriver) is already running");
  } else {
    try {
      let user_input = prompt("TED (TestEventDriver) is not running. Do you want to pull & run the latest Docker container for TED (TestEventDriver)? (y/n): ").trim().toLowerCase();
      if (user_input === "yes" || user_input === "y") {
        console.log("INFO", "Running the Docker container for TED (TestEventDriver)");
        execSync("docker run --name ted --rm -d --pull always -p 2022:22 -p 5001:5001 -p 3306:3306 -p 28017:27017 -p 5433:5432 -p 25:25 -p 4200:4200 appsmith/test-event-driver", { stdio: "inherit" });
        console.log("INFO", "Please check https://github.com/appsmithorg/TestEventDriver for more details and functionalities of TED");
      } else if (user_input === "no" || user_input === "n") {
        console.log("INFO", "Proceeding without TED");
      } else {
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
  try {
    const response = await fetch(baseUrl);
    if (!response.ok) throw new Error('Response not OK');
  } catch (error) {
    let user_input = prompt(`https://dev.appsmith.com is not accessible. Do you wish to continue without setting it up? (yes/no): `).trim().toLowerCase();
    if (user_input !== "yes" && user_input !== "y") process.exit(1);
    console.log("INFO", "Continuing without setting up dev.appsmith.com");
  }
}

function getBaseUrl(repoRoot) {
  try {
    const cypressConfig = readFileSync(`${repoRoot}/cypress.config.ts`, "utf8");
    const baseUrlMatch = cypressConfig.match(/baseUrl\s*:\s*"([^"]+)"/);
    if (baseUrlMatch) {
      console.log("INFO", `Base url is ${baseUrlMatch[1]}. Please verify if it is correct. If not, please update it in cypress.config.ts file.`);
      return baseUrlMatch[1];
    } else {
      throw new Error("Base url not found");
    }
  } catch (err) {
    console.error("ERROR", err.code === "ENOENT" ? "cypress.config.ts file not found" : `Error reading cypress.config.ts file: ${err}`);
    process.exit(1);
  }
}

function ensureCypressEnvFileExists(repoRoot) {
  const filePath = `${repoRoot}/cypress.env.json`;
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify({
      USERNAME: "testUser@test.com",
      PASSWORD: "testPass",
      TESTUSERNAME1: "viewerappsmith@test.com",
      TESTPASSWORD1: "viewerPass",
      TESTUSERNAME2: "developerappsmith@test.com",
      TESTPASSWORD2: "developerPass"
    }, null, 2));
    console.log("INFO", `${repoRoot}/cypress.env.json file created`);
  } else {
    console.log("INFO", `${repoRoot}/cypress.env.json file already exists`);
  }
}

async function setupCypress() {
  const repoRoot = path.join(__dirname, "..", "..");
  const baseUrl = getBaseUrl(repoRoot);
  await runLocalServer();
  await checkIfAppsmithIsRunning(baseUrl);
  console.log("INFO", "Installing Cypress..");
  try {
    execSync("yarn install", { cwd: `${repoRoot}` });
  } catch (error) {
    console.error("ERROR", `Error installing Cypress: ${error.message}`);
  }
  ensureCypressEnvFileExists(repoRoot);
  console.log("INFO", "Please add APPSMITH_GIT_ROOT=./container-volumes/git-storage into server-side .env for running Git cases locally along with the server.");
  ensureTEDIsRunning();
  console.log("INFO", "Please start cypress using the command: npx cypress open");
  console.log("INFO", `In order to run single spec, please use the command: cd ${repoRoot} && npx cypress run --spec <specpath> --browser chrome`);
  console.log("INFO", "For more details check https://github.com/appsmithorg/appsmith/blob/master/contributions/ClientSetup.md#integration-tests");
}

async function main() {
  await setupCypress();
  process.exit(0);
}

main();