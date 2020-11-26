# How can I contribute to the Cypress Test Suite?

1. Follow the setup document to set up [Appsmith locally](contributions/ClientSetup.md) and go through [the docs](https://docs.appsmith.com). The docs are backed by the [appsmith-docs](https://github.com/appsmithorg/appsmith-docs) repository.

1. Once we have the setup in place, all dependencies will be available locally for test execution.

1. Cypress tests are located in the `app/client/cypress` directory.

1. All the test spec _must_ be in the integration directory only i.e `app/client/cypress/integration`

1. You can create directories under `app/client/cypress` but make sure you place the spec within the `app/client/cypress/integration` directory.

1. Directory name under `app/client/cypress/integration` suggests the specific area the test belongs to. Example: All our [Smoke tests](<https://en.wikipedia.org/wiki/Smoke_testing_(software)>) are in `app/client/cypress/integration/Smoke_TestSuite`

1. For default settings, check the `app/client/cypress.json` file.

1. You can create a local file `app/client/cypress.env.json` to populate `USERNAME` and `PASSWORD` env variables or use one of the methods [from their docs](https://docs.cypress.io/guides/guides/environment-variables.html#Setting).

   ```json
   {
     "USERNAME": "Enter username",
     "PASSWORD": "Enter password"
   }
   ```

1. Once the `app/client/cypress.env.json` file is ready, we can actually run tests from the cypress client.

1. Change your directory to `app/client`.

1. Cypress tests can be executed in 2 modes: run mode and open mode.
   If you are willing to execute tests in headless mode through command line follow [run mode](https://docs.cypress.io/guides/guides/command-line.html#How-to-run-commands) else you can use cypress client to run in [open mode](https://docs.cypress.io/guides/guides/launching-browsers.html#Browsers)

1. Command to open cypress client `$(npm bin)/cypress open` Cypress supports Chrome/Firefox/electron browsers. Select a suitable browser and check the status of your tests.

1. For run mode, you can use CLI args. Example: To run the entire `Smoke_TestSuite`, use `$(npm bin)/cypress run --headless --browser chrome --spec "cypress/integration/Smoke_TestSuite/*/*"`

1. If you need help with writing the tests, their syntax or flow, cypress [getting started docs](https://docs.cypress.io/guides/getting-started/writing-your-first-test.html) is a great starting point.

## A word about env variables in Cypress tests

If you want to add a new env variable to cypress tests, add it to the `cypress.env.json` file and also in the documentation above.

All ENV variables from your `.env` file and all `APPSMITH_*` env variables from `process.env` are accessible with the `Cypress.env()` method.
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
