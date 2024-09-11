import { defineConfig } from "cypress";

export default defineConfig({
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
    baseUrl: "http://localhost/",
    setupNodeEvents(on, config) {
      require("@cypress/grep/src/plugin")(config);
      return require("./cypress/plugins/index.js")(on, config);
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: false,
    excludeSpecPattern: [
      "cypress/e2e/**/spec_utility.ts",
      "cypress/e2e/GSheet/**/**/*",
      "cypress/e2e/Sanity/Datasources/Airtable_Basic_Spec.ts",
      "cypress/e2e/Regression/ClientSide/CommunityTemplate/*",
      "cypress/e2e/Regression/ServerSide/Datasources/ElasticSearch_Basic_Spec.ts",
    ],
  },
});
