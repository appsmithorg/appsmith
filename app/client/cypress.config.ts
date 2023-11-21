import { defineConfig } from "cypress";
import { tagify } from 'cypress-tags';

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 30000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  pageLoadTimeout: 60000,
  video: true,
  numTestsKeptInMemory: 5,
  experimentalMemoryManagement: true,
  experimentalModifyObstructiveThirdPartyCode: true,
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
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: "http://localhost/",
    experimentalOriginDependencies: true,
    env: {
      grepFilterSpecs: true,
      grepOmitFiltered: true,
      USERNAME: "sharanya@appsmith.com",
      PASSWORD: "Appsmith1@",
      GITEA_TOKEN : "fa1080b66dc0f7f5799dc7d274a446e902456937"
    },
    setupNodeEvents(on, config) {
      require("@cypress/grep/src/plugin")(config);
      require("./cypress/plugins/index.js")(on, config);
      return config;
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: true,
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
