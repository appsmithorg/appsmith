import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "playwright/.env") });

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "https://dev.appsmith.com";

export default defineConfig({
  testDir: "./playwright/tests",
  testMatch: "**/*.spec.ts",
  outputDir: "./playwright/results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  reporter: isCI
    ? [
        ["html", { open: "never" }],
        ["json", { outputFile: "playwright/results/results.json" }],
      ]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: "on",
    screenshot: "only-on-failure",
    video: "on",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "signup-setup",
      testDir: "./playwright/fixtures",
      testMatch: /signup\.setup\.ts/,
    },
    {
      name: "setup",
      dependencies: ["signup-setup"],
      testDir: "./playwright/fixtures",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "migration-setup",
      dependencies: ["setup"],
      testDir: "./playwright/fixtures",
      testMatch: /migration\.setup\.ts/,
      use: {
        storageState: "playwright/auth/user.json",
      },
      teardown: "migration-teardown",
    },
    {
      name: "migration-teardown",
      testDir: "./playwright/fixtures",
      testMatch: /migration\.teardown\.ts/,
      use: {
        storageState: "playwright/auth/user.json",
      },
    },

    {
      name: "smoke",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/auth/user.json",
      },
      testDir: "./playwright/tests/smoke",
    },
    {
      name: "sanity",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/auth/user.json",
      },
      testDir: "./playwright/tests/sanity",
    },
    {
      name: "regression",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/auth/user.json",
      },
      testDir: "./playwright/tests/regression",
      testIgnore: ["**/git/**"],
    },
    {
      name: "regression-git",
      dependencies: ["migration-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/auth/user.json",
      },
      testDir: "./playwright/tests/regression/git",
    },
  ],
});
