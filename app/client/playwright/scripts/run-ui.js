const dotenv = require("dotenv");
const path = require("path");
const { execSync } = require("child_process");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

execSync("npx playwright test --ui", {
  stdio: "inherit",
  env: process.env,
  cwd: path.resolve(__dirname, "../.."),
});
