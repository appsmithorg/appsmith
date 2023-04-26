import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 20000,
  requestTimeout: 21000,
  responseTimeout: 20000,
  pageLoadTimeout: 30000,
  videoUploadOnPasses: false,
  videoCompression: false,
  numTestsKeptInMemory: 10,
  reporterOptions: {
    reportDir: 'results',
    overwrite: false,
    html: true,
    json: false,
  },
  experimentalStudio: true,
  env: {
    USERNAME: 'abcd@appsmith.com',
    PASSWORD: 'HelloWorld',
    TESTUSERNAME1: 'viewerappsmith@mailinator.com',
    TESTPASSWORD1: 'Test@123',
    TESTUSERNAME2: 'developerappsmith@mailinator.com',
    TESTPASSWORD2: 'Test@123',
  },
  chromeWebSecurity: false,
  viewportHeight: 1100,
  viewportWidth: 1400,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'https://release.app.appsmith.com/',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
