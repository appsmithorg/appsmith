# How can I contribute to the Cypress Test Suite?

1. Follow the setup document to set up [Appsmith locally](/contributions/ClientSetup.md) and go through [the docs](https://docs.appsmith.com). The docs are backed by the [appsmith-docs](https://github.com/appsmithorg/appsmith-docs) repository.

1. Once we have the setup in place, all dependencies will be available locally for test execution.

1. Cypress tests are located in the `app/client/cypress` directory.

1. All the test spec _must_ be in the e2e directory only i.e. `app/client/cypress/e2e`

1. You can create directories under `app/client/cypress` but make sure you place the spec within the `app/client/cypress/e2e` directory.

1. Directory name under `app/client/cypress/e2e` suggests the specific area the test belongs to. Example: All our [Regression tests](<https://en.wikipedia.org/wiki/Smoke_testing_(software)>) are in `app/client/cypress/e2e/Regression`

1. For default settings, check the `app/client/cypress.config.ts` file.

1. Update file `app/client/cypress.config.ts` to populate `USERNAME` and `PASSWORD` env variables or use one of the methods [from their docs](https://docs.cypress.io/guides/guides/environment-variables.html#Setting).

   ```json
   {
     "USERNAME": "Enter username",
     "PASSWORD": "Enter password"
   }
   ```

1. Once the `app/client/cypress.config.ts` file is ready, we can actually run tests from the cypress client.

1. Change your directory to `app/client`.

1. Cypress tests can be executed in 2 modes: run mode and open mode.
   If you are willing to execute tests in headless mode through command line follow [run mode](https://docs.cypress.io/guides/guides/command-line.html#How-to-run-commands) else you can use cypress client to run in [open mode](https://docs.cypress.io/guides/guides/launching-browsers.html#Browsers)

1. Command to open cypress client `$(npm bin)/cypress open` Cypress supports Chrome/Firefox/electron browsers. Select a suitable browser and check the status of your tests.

1. For run mode, you can use CLI args. Example: To run the all the tests under `Regression`, use `$(npm bin)/cypress run --headless --browser chrome --spec "cypress/e2e/Regression/*/*"`

1. If you need help with writing the tests, their syntax or flow, cypress [getting started docs](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#What-you-ll-learn) is a great starting point.

## A word about env variables in Cypress tests

If you want to add a new env variable to cypress tests, add it to the `cypress.config.ts` file and also in the documentation above.

All ENV variables from your `.env` file and all `APPSMITH_*` env variables from `process.env` are accessible with the `Cypress.env()` method.

## Speeding up debugging/writing tests

- The test suite has a flag to enable rapid mode, which skips a few test environment setup steps if it is already setup.
- This speeds up the execution of the test run and is helpful during debugging and writing tests. Some of the steps that it skips are,
   - Creation of a new test app everytime. We can pass an app id to the test so that it can reuse it and avoid creating a new app everytime.
   - Skip login if the user is already logged in from previous test run session.
   - Skip multiple visit to the workspace page if a test uses DSL for loading fixtures. If a test uses DSL, a visit to the workspace is mandatory. Thus avoiding multiple visits to the workspace page saves time during test run.
   - To enable rapid mode for your test, you can add following configuration to your `cypress.config.ts` file created above,
```
      "RAPID_MODE": {
        "enabled" : true, // Set it to true to enable rapid mode, otherwise set it to false
        "appName": "5f8e1666", // Pass your app name here. Given value is a sample value for reference
        "pageName": "page-1", // Pass your page name here. Given value is a sample value for reference
        "pageID": "64635173cc2cee025a77f489", // Pass your PageID here. Given value is a sample value for reference
        "url": "https://dev.appsmith.com/app/5f8e1666/page1-64635173cc2cee025a77f489/edit", // You can choose to pass in url of your app instead of individual parameters above.
        "usesDSL": true // Set it to false, if your test doesn't use DSL. If your test uses DSL, you can choose to enable this flag to skip multiple visits to the workspace page.
      }
```
- You can either pass in complete url for your app in the test or pass in parameters for your app and the url will be generated on its own.

## How do I add environment variables required for Cypress tests?

**Note:** This can only be done by the project maintainers. Please contact one of them if you require this step to be accomplished.

1. Go to [https://github.com/appsmithorg/appsmith/settings/secrets/actions](https://github.com/appsmithorg/appsmith/settings/secrets/actions).
1. Click on "New Repository Secret"
1. Add the secret key & value here. These values will be masked in the CI output logs incase they are printed out.
1. Save the value.
1. In the file `.github/workflows/client.yml`, find the steps named: "Setting up the cypress tests" & "Run the cypress test". These steps are responsible for setting up & executing the Cypress tests.
1. Add the env variable there in the form:

   ```
   YOUR_SECRET_KEY: ${{ secrets.APPSMITH_YOUR_SECRET_KEY }}
   ```

1. Commit & push the file `.github/workflows/client.yml` to the default branch (`release`). Please remember that the changes to the build file will not take effect unless they are committed against the default branch.
