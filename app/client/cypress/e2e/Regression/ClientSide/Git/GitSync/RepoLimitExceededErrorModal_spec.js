import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import {
  gitSync,
  agHelper,
  homePage,
  onboarding,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import { REPO, CURRENT_REPO } from "../../../../../fixtures/REPO";

let repoName1, repoName2, repoName3, repoName4, windowOpenSpy;
describe("Repo Limit Exceeded Error Modal", function () {
  before(() => {
    const uuid = require("uuid");
    repoName1 = uuid.v4().split("-")[0];
    repoName2 = uuid.v4().split("-")[0];
    repoName3 = uuid.v4().split("-")[0];
    repoName4 = uuid.v4().split("-")[0];
  });

  it("1. Verify Repo limit flow for CE and EE instances", function () {
    homePage.LogOutviaAPI();
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    agHelper.AssertElementVisibility(locators._sidebar);
    onboarding.closeIntroModal();
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    gitSync.CreateNConnectToGit(repoName1, true, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName1 = repName;
    });
    cy.pause();
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    gitSync.CreateNConnectToGit(repoName2, true, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName2 = repName;
    });
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    gitSync.CreateNConnectToGit(repoName3, true, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName3 = repName;
    });
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    gitSync.CreateNConnectToGit(repoName4, true, true);
    cy.get("@gitRepoName").then((repName) => {
      repoName4 = repName;
    });
    if (CURRENT_REPO === REPO.CE) {
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
      cy.get(gitSyncLocators.gitModalLink).should(
        "contain.text",
        "Contact Support",
      );
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
      cy.get(gitSyncLocators.gitModalLink).contains("Learn more").click();

      cy.get(gitSyncLocators.connectedApplication).should("have.length", 3);
      cy.get(gitSyncLocators.diconnectLink).first().click();

      cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
      cy.get(gitSyncLocators.disconnectGitModal).should("exist");

      cy.get(gitSyncLocators.closeGitSyncModal).click();
      cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
    }
    if (CURRENT_REPO === REPO.EE) {
      cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
      gitSync.closeGitSyncModal();
      agHelper.AssertElementExist(gitSync._bottomBarCommit);
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
    gitSync.DeleteTestGithubRepo(repoName1);
    gitSync.DeleteTestGithubRepo(repoName2);
    gitSync.DeleteTestGithubRepo(repoName3);
    gitSync.DeleteTestGithubRepo(repoName4);
  });
});
