import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 30000,
  requestTimeout: 60000,
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  videoUploadOnPasses: false,
  videoCompression: false,
  numTestsKeptInMemory: 5,
  experimentalMemoryManagement: true,
  reporterOptions: {
    reportDir: "results",
    overwrite: false,
    html: true,
    json: false,
  },
  chromeWebSecurity: false,
  viewportHeight: 660,
  viewportWidth: 1000,
  scrollBehavior: "center",
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: "http://localhost/",
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: false,
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
