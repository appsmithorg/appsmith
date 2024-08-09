import { defineConfig } from "cypress";

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 30000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  pageLoadTimeout: 60000,
  video: true,
  numTestsKeptInMemory: 5,
  experimentalMemoryManagement: true,
  reporterOptions: {
    reportDir: "results",
    overwrite: false,
    html: true,
    json: false,
  },
  chromeWebSecurity: false,
  viewportHeight: 1200,
  viewportWidth: 1400,
  scrollBehavior: "center",
  retries: {
    runMode: 0,
    openMode: 0,
  },
  e2e: {
    baseUrl: "https://dev.appsmith.com/",
    env: {
      USERNAME: "xxxx",
      PASSWORD: "xxx",
      grepFilterSpecs: true,
      grepOmitFiltered: true,
    },
    setupNodeEvents(on, config) {
      require("@cypress/grep/src/plugin")(config);
      require("./cypress/plugins/index.js")(on, config);
      return config;
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: false,
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
