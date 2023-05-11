import { defineConfig } from "cypress";

export default defineConfig({
  //watchForFileChanges: false,
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
  viewportHeight: 1500,
  viewportWidth: 1700,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    env: {
      USERNAME: "xxx",
      PASSWORD: "xxxx",
    },
    baseUrl: "http://localhost/",
    specPattern: 'cypress/e2e/**/*.{js,ts}',
    testIsolation: false
  },
});
