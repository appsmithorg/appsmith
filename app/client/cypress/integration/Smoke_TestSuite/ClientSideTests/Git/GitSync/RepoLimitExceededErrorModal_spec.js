import gitSyncLocators from "../../../../../locators/gitSyncLocators";

let repoName1, repoName2, repoName3, repoName4, windowOpenSpy;
describe("Repo Limit Exceeded Error Modal", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    const uuid = require("uuid");
    repoName1 = uuid.v4().split("-")[0];
    repoName2 = uuid.v4().split("-")[0];
    repoName3 = uuid.v4().split("-")[0];
    repoName4 = uuid.v4().split("-")[0];
  });

  it("modal should be opened with proper components", function() {
    cy.createAppAndConnectGit(repoName1, false);
    cy.createAppAndConnectGit(repoName2, false);
    cy.createAppAndConnectGit(repoName3, false);
    cy.createAppAndConnectGit(repoName4, false, true);

    cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("exist");

    // title and info text checking
    cy.get(gitSyncLocators.repoLimitExceededErrorModal).contains(
      Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED(),
    );
    cy.get(gitSyncLocators.repoLimitExceededErrorModal).contains(
      Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED_INFO(),
    );
    cy.get(gitSyncLocators.repoLimitExceededErrorModal).contains(
      Cypress.env("MESSAGES").CONTACT_SUPPORT_TO_UPGRADE(),
    );
    cy.get(gitSyncLocators.contactSalesButton).should("exist");
    cy.get(gitSyncLocators.repoLimitExceededErrorModal).contains(
      Cypress.env("MESSAGES").DISCONNECT_CAUSE_APPLICATION_BREAK(),
    );

    // learn more link checking
    cy.window().then((window) => {
      windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
        expect(url.startsWith("https://docs.appsmith.com/")).to.be.true;
        windowOpenSpy.restore();
      });
    });
    cy.get(gitSyncLocators.learnMoreOnRepoLimitModal).click();

    cy.get(gitSyncLocators.connectedApplication).should("have.length", 3);
    cy.get(gitSyncLocators.diconnectLink)
      .first()
      .click();

    cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
    cy.get(gitSyncLocators.disconnectGitModal).should("exist");

    cy.get(gitSyncLocators.closeRevokeModal).click();
    cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
  });
  after(() => {
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + repoName1,
      failOnStatusCode: false,
    });
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + repoName2,
      failOnStatusCode: false,
    });
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + repoName3,
      failOnStatusCode: false,
    });
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + repoName4,
      failOnStatusCode: false,
    });
    cy.deleteTestGithubRepo(repoName1);
    cy.deleteTestGithubRepo(repoName2);
    cy.deleteTestGithubRepo(repoName3);
    cy.deleteTestGithubRepo(repoName4);
  });
});
