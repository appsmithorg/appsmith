## Contributing code

### 🍴 Git Workflow

We use [Github Flow](https://guides.github.com/introduction/flow/index.html), so all code changes happen through pull requests. 

Pull requests are the best way to propose changes to the codebase and get them reviewed by maintainers.

1. Fork the repo and create your branch from `release`.
2. If you've added code that should be tested, add tests. If it's a client-side change, tests must be added via Cypress/Jest. For server-side changes, please add JUnit tests.
3. If you've changed any APIs, please call this out in the pull request. Also, don't forget to add/modify integration tests via Cypress to ensure that changes are backwards compatible.
4. At all times, ensure the test suite passes. We will not be able to accept your change if the test suite doesn't pass.
5. Create an issue referencing the pull request. This ensures that we can track the bug being fixed or feature being added easily.

### 🏡 Setup for local development
- [Client](contributions/ClientSetup.md)
- [Server](contributions/ServerSetup.md)

### 🧪 Running tests

##### Client
1. In order to run the Cypress integration tests, run:
```bash
  cd app/client
  yarn run test
```

2. In order to run the Jest unit tests, run:
```bash
  cd app/client
  yarn run test:unit
```

##### Server
1. Ensure that you have Redis running on your local system.

2. Run the command to execute tests
```bash
  cd app/server
  mvn clean package
```

### 🔍 Code and copy reviews
All submissions, including submissions by project members, require review. We use GitHub pull requests for this purpose. Consult GitHub Help for more information on using pull requests.
