import { defineConfig } from "cypress";

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 30000,
  requestTimeout: 21000,
  responseTimeout: 30000,
  pageLoadTimeout: 30000,
  videoUploadOnPasses: false,
  videoCompression: false,
  numTestsKeptInMemory: 10,
  reporterOptions: {
    reportDir: "results",
    overwrite: false,
    html: true,
    json: false,
  },
  chromeWebSecurity: false,
  viewportHeight: 1200,
  viewportWidth: 1600,
  retries: {
    runMode: 1,
    openMode: 0,
  },

  e2e: {
    baseUrl: "https://ce-23845.dp.appsmith.com/",
    env: {
      USERNAME: "abcd@appsmith.com",
      PASSWORD: "HelloWorld",
    },
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
      require('@cypress/code-coverage/task')(on, config);
            return config;

    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
