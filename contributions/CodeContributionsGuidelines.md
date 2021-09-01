## Contributing code

### 🔎 Code and copy reviews

All submissions, including submissions by project members, require review. We use GitHub pull requests for this purpose. Consult GitHub Help for more information on using pull requests.
Before raising a pull request, ensure you have raised a corresponding issue and discussed a possible solution with a maintainer. This gives your pull request the highest chance of getting merged quickly.

### Good First Issues 
- [Frontend (React / HTML / CSS / JS)](https://github.com/appsmithorg/appsmith/issues?q=is%3Aissue+is%3Aopen+label%3A%22Good+First+Issue%22+label%3A%22Frontend%22+no%3Aassignee)
- [Backend (Java / Mongo / Springboot)](https://github.com/appsmithorg/appsmith/issues?q=is%3Aissue+is%3Aopen+label%3A%22Good+First+Issue%22+label%3A%22Backend%22+no%3Aassignee)

### 🍴 Git Workflow

We use [Github Flow](https://guides.github.com/introduction/flow/index.html), so all code changes happen through pull requests. 

1. Fork the repo and create a new branch from the `release` branch.
2. Branches are named as `fix/fix-name` or `feature/feature-name`
3. Please add tests for your changes. Client-side changes require Cypress/Jest tests while server-side changes require JUnit tests.
4. Once you are confident in your code changes, create a pull request in your fork to the release branch in the appsmithorg/appsmith base repository.
5. If you've changed any APIs, please call this out in the pull request and ensure backward compatibility.
6. Link the issue of the base repository in your Pull request description. [Guide](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue)
7. When you raise a pull request, we automatically run tests on our CI. Please ensure that all the tests are passing for your code change. We will not be able to accept your change if the test suite doesn't pass.

### 🏡 Setup for local development

- [Running the Client](ClientSetup.md)
- [Running the Server](ServerSetup.md)

### 🧪 Running tests

#### Client
1. In order to run the Cypress integration tests, you can create a local file `app/client/cypress.env.json` to populate `USERNAME` and `PASSWORD` env variables or use one of the methods [from their docs](https://docs.cypress.io/guides/guides/environment-variables.html#Setting).

   ```json
   {
     "USERNAME": "Enter username",
     "PASSWORD": "Enter password"
   }
   ```

1. run:
```bash
  cd app/client
  yarn run test
```

Please check out our [Testing Contribution](docs/TestAutomation.md) guide for more details on setting up & troubleshooting Cypress runs on your machine.


2. In order to run the Jest unit tests, run:
```bash
  cd app/client
  yarn run test:unit
```

#### Server
1. Ensure that you have Redis running on your local system.

2. Run the command to execute tests
```bash
  cd app/server
  mvn clean package
```

### Contribute Code
#### Server Code
Please follow these guidelines according to the module that you wish to contribute to:
- [Plugin](./ServerCodeContributionsGuidelines/PluginCodeContributionsGuidelines.md)

#### Client Code
Please follow the below guideline to add a new JS library to the Appsmith platform:
- [Add Custom JS Library](./CustomJsLibrary.md)