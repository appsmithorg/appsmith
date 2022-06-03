import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 30000,
  requestTimeout: 21000,
  responseTimeout: 30000,
  pageLoadTimeout: 80000,
  video: true,
  videoUploadOnPasses: false,
  reporter: 'mochawesome',
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
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'https://release.app.appsmith.com/',
    experimentalSessionAndOrigin: false,
    excludeSpecPattern: [
      '**/Smoke_TestSuite/Application/PgAdmin_spec*.js',
      '**/Smoke_TestSuite/ClientSideTests/DisplayWidgets/Table_Filter_spec*.js',
      '**/Smoke_TestSuite/ClientSideTests/Onboarding/FirstTimeUserOnboarding_spec*.js',
      '**/Smoke_TestSuite/ClientSideTests/Templates/Fork_Template_spec.js',
    ],
  },
})
