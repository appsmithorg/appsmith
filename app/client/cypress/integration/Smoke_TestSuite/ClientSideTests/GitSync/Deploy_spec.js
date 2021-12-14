import gitSyncLocators from "../../../../locators/gitSyncLocators";
const homePage = require("../../../../locators/HomePage");

const httpsRepoURL = "https://github.com/test/test.git";
const invalidURL = "test";
const invalidURLDetectedOnTheBackend = "test@";

const invalidEmail = "test";
const invalidEmailWithAmp = "test@hello";

const GITHUB_API_BASE = "https://api.github.com";

let repoName;
let generatedKey;
let windowOpenSpy;
let githubDeployKeyId;
const owner = Cypress.env("TEST_GITHUB_USER_NAME");
describe("Git sync modal: connect tab", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
    });
  });

  beforeEach(() => {
    cy.intercept(
      {
        url: "api/v1/git/connect/*",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
