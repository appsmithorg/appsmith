## Contributing code

### Getting Started

All submissions, including submissions by project members, require review. We use GitHub pull requests for this purpose. Consult GitHub Help for more information on using pull requests.
Before raising a pull request, ensure you have raised a corresponding issue and discussed a possible solution with a maintainer. This gives your pull request the highest chance of getting merged quickly.

### Good First Issues 

Looking for issues to contribute? [Good First Issues](https://github.com/appsmithorg/appsmith/issues?page=3&q=is%3Aopen+is%3Aissue+label%3A%22Good+First+Issue%22) is a great place to begin your contribution journey with Appsmith!

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


### Other Contributions
#### Server Code
Please follow these guidelines according to the module that you wish to contribute to:
- [Plugin](./ServerCodeContributionsGuidelines/PluginCodeContributionsGuidelines.md)

#### Client Code

Please follow the below guideline to add a new JS library to the Appsmith platform:
- [Add Custom JS Library](./CustomJsLibrary.md)

Please follow the below guideline for widget development
- [Widget Development Guideline](./AppsmithWidgetDevelopmentGuide.md)
