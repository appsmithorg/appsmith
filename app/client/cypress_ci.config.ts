import { defineConfig } from "cypress";

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 20000,
  requestTimeout: 21000,
  responseTimeout: 20000,
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
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    baseUrl: "http://localhost/",
    specPattern: "cypress/e2e/**/*.{js,ts}"
  },
});
