import gitSyncLocators from "../../../../locators/gitSyncLocators";
const homePage = require("../../../../locators/HomePage");

const httpsRepoURL = "https://github.com/test/test.git";
const invalidURL = "test";
const invalidURLDetectedOnTheBackend = "test@";

const GITHUB_API_BASE = "https://api.github.com";

let repoName;
let generatedKey;
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

  it("validates repo URL", function() {
    // open gitSync modal
    cy.get(homePage.deployPopupOptionTrigger).click();
    cy.get(homePage.connectToGitBtn).click();

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${httpsRepoURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${invalidURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}git@github.com:${owner}/${repoName}.git`,
    );
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO()).should(
      "not.exist",
    );
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.be.disabled");

    cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
      "generateKey",
    );

    cy.get(gitSyncLocators.generateDeployKeyBtn).click();

    cy.wait("@generateKey").then((result) => {
      generatedKey = result.response.body.data.publicKey;
    });
  });

  it("validates copy key", function() {
    cy.window().then((win) => {
      cy.stub(win, "prompt")
        .returns(win.prompt)
        .as("copyToClipboardPrompt");
    });

    cy.get(gitSyncLocators.copySshKey).click();
    cy.get("@copyToClipboardPrompt").should("be.called");
    cy.get("@copyToClipboardPrompt").should((prompt) => {
      expect(prompt.args[0][1]).to.equal(generatedKey);
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
    });
  });

  it("validates repo url input after key generation", function() {
    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${httpsRepoURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.connectSubmitBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${invalidURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.connectSubmitBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}git@github.com:${owner}/${repoName}.git`,
    );
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO()).should(
      "not.exist",
    );
    cy.get(gitSyncLocators.connectSubmitBtn).should("not.be.disabled");
  });

  it("validates git user config", function() {
    cy.get(gitSyncLocators.gitConfigNameInput)
      .invoke("val")
      .should("not.be.empty");
    cy.get(gitSyncLocators.gitConfigEmailInput)
      .invoke("val")
      .should("not.be.empty");

    // TODO: validate git user config cases (incomplete)
  });

  it("validates submit errors", function() {
    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}${invalidURLDetectedOnTheBackend}`,
    );
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.wait("@connectGitRepo");
    cy.contains("Remote URL is incorrect!");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}git@github.com:${owner}-test/${repoName}.git`,
      {
        force: true,
      },
    );
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.wait("@connectGitRepo");

    cy.contains("SSH Key is not configured properly");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}git@github.com:${owner}/${repoName}.git`,
      {
        force: true,
      },
    );

    cy.request({
      method: "POST",
      url: `${GITHUB_API_BASE}/repos/${Cypress.env(
        "TEST_GITHUB_USER_NAME",
      )}/${repoName}/keys`,
      headers: {
        Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
      },
      body: {
        title: "key0",
        key: generatedKey,
        read_only: true,
      },
    }).then((response) => {
      githubDeployKeyId = response.body.id;
    });

    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.wait("@connectGitRepo");

    cy.contains("SSH Key is not configured properly");
  });

  it("validate connection success", function() {
    // NOTE: connection success is validated in other git related specs
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
