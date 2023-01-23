import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName1, repoName2, repoName3, repoName4, windowOpenSpy;
describe.skip("Repo Limit Exceeded Error Modal", function() {
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

  it("1. Modal should be opened with proper components", function() {
    _.homePage.CreateNewApplication();
    _.gitSync.CreateNConnectToGit(repoName1, false, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName1 = repName;
    });
    _.gitSync.CreateNConnectToGit(repoName2, false, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName2 = repName;
    });
    _.gitSync.CreateNConnectToGit(repoName3, false, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName3 = repName;
    });
    _.gitSync.CreateNConnectToGit(repoName4, true, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName4 = repName;
    });

    // cy.createAppAndConnectGit(repoName1, false);
    // cy.createAppAndConnectGit(repoName2, false);
    // cy.createAppAndConnectGit(repoName3, false);
    // cy.createAppAndConnectGit(repoName4, false, true);

    if (Cypress.env("Edition") === 0) {
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
        Cypress.env("MESSAGES").REVOKE_CAUSE_APPLICATION_BREAK(),
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
    }
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
    _.gitSync.DeleteTestGithubRepo(repoName1);
    _.gitSync.DeleteTestGithubRepo(repoName2);
    _.gitSync.DeleteTestGithubRepo(repoName3);
    _.gitSync.DeleteTestGithubRepo(repoName4);
  });
});
