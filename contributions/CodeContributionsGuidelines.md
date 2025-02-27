## Contributing code

### Getting Started

All submissions, including submissions by project members, require review. We use GitHub pull requests for this purpose. Consult GitHub Help for more information on using pull requests.
Before raising a pull request, ensure you have raised a corresponding issue and discussed a possible solution with a maintainer. This gives your pull request the highest chance of getting merged quickly.

### Good First Issues

Looking for issues to contribute to? Check out our [Inviting Contribution Issues](https://github.com/appsmithorg/appsmith/issues?q=is:open+is:issue+label:%22Inviting+Contribution%22+) – a great starting point for your contribution journey with Appsmith! Tag @contributor-support to have an issue assigned to you. If you choose to work on issues outside this list, please collaborate closely with us. Failure to inform and get the issue assigned beforehand may result in your contribution being rejected, leading to wasted effort for both parties.

#### What not to do:
1. Work on issues without informing the maintainer. Please get them assigned to yourself first. Comment on the issue if you are interested. 
2. Naming lengthy branches. 
3. Create PR(s) without proper description. 
4. Requesting for review without latest release pull on PR. 
5. Raising PR(s) without tests.  
6. Not going through the code contribution guidelines before first contribution. Just kidding, you are already here 😉

### 🍴 Git Workflow

We use [Github Flow](https://guides.github.com/introduction/flow/index.html), so all code changes happen through pull requests.

1. Fork the repo and create a new branch from the `release` branch.
2. Branches are named as `fix/fix-name` or `feature/feature-name`
3. Please add tests for your changes. Client-side changes require Cypress/Jest tests while server-side changes require JUnit tests.
4. If you are adding new cypress tests, add test path to `limited-tests.txt`
5. Once you are confident in your code changes, create a pull request in your fork to the release branch in the appsmithorg/appsmith base repository.
6. If you've changed any APIs, please call this out in the pull request and ensure backward compatibility.
7. Link the issue of the base repository in your Pull request description. [Guide](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue)
8. When you raise a pull request, tag the maintainer you are collaborating with to start the build process.
9. If changes are requested, work on them, commit them back, and tag the reviewer again. 
10. Once all changes have been approved by the reviewer and the CI has run successfully, your PR will be merged into the base branch. Congratulations! 

### 🏡 Setup for local development

#### Pre-requisites

1. Install `gitleaks`
   - `brew install gitleaks` (macOS)
   - [Others](https://github.com/gitleaks/gitleaks#getting-started)

#### Code setup

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
