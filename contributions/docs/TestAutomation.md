# How can I contribute to the Cypress Test Suite?
 
1. Follow the initial document to set up [Appsmith locally](https://docs.appsmith.com). The docs are backed by the [appsmith-docs](https://github.com/appsmithorg/appsmith-docs) repository.
 
2. Once we have the setup in place, all dependencies will be available locally for test execution.
 
3. Change your directory to `appsmith/app/client`.
 
4. Cypress tests are located within, cypress folder.
 
5. All the test spec must be within the integration folder only i.e `appsmith/app/client/cypress/integration`
 
6. You can create folders within the cypress folder but make sure you place the spec within the integrations folder.
 
7. Cypress tests can be executed in 2 modes: run mode and open mode.
If you are willing to execute tests in headless mode through command line follow [run mode](https://docs.cypress.io/guides/guides/command-line.html#How-to-run-commands) else you can use cypress client to run in [open mode](https://docs.cypress.io/guides/guides/launching-browsers.html#Browsers)
 
8. Command to open cypress client `./node_modules/.bin/cypress open`
 
9. Cypress client looks something like this and you will have all the e2e spec’s within [Smoke_TestSuite](https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Step-1-Visit-a-page)
 
10. Folder name suggests the specific area the test belongs to.
 
11. Before we get started with writing our new tests, please make sure you set up your cypress.json file properly.
Below are the config options used by our framework, enter the URL you are running your tests, also within the env 
Config add your registered username and password.
 
```bash
{
  "baseUrl": “Enter URL under test”,
  "defaultCommandTimeout": 20000,
  "requestTimeout": 21000,
  "pageLoadTimeout": 20000,
  "video": false,
  "reporter": "mochawesome",
  "reporterOptions": {
    "reportDir": "results",
    "overwrite": false,
    "html": true,
    "json": false
  },
  "env": {
    "USERNAME": “Enter username”,
    "PASSWORD": “Enter password”,
    },
  "viewportHeight": 900,
  "viewportWidth": 1400
}
```
12. Once the cypress.json file is ready, we can actually run tests from the cypress client.
13. Cypress supports Chrome/Firefox/electron browsers. Select a suitable browser and check the status of your tests.
