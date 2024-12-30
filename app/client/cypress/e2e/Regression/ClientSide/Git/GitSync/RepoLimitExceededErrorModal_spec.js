import {
  gitSync,
  agHelper,
  homePage,
  onboarding,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import { REPO, CURRENT_REPO } from "../../../../../fixtures/REPO";

let repoName1, repoName2, repoName3, repoName4, windowOpenSpy;
describe(
  "Repo Limit Exceeded Error Modal",
  {
    tags: [
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    before(() => {
      const uuid = require("uuid");
      repoName1 = uuid.v4().split("-")[0];
      repoName2 = uuid.v4().split("-")[0];
      repoName3 = uuid.v4().split("-")[0];
      repoName4 = uuid.v4().split("-")[0];
      agHelper.AssertElementVisibility(locators._sidebar);
      onboarding.closeIntroModal();
    });

    it("1. Verify Repo limit flow for CE/EE instances", function () {
      homePage.Signout();
      cy.generateUUID().then((uid) => {
        homePage.SignUp(`${uid}@appsmithtest.com`, uid);
        onboarding.closeIntroModal();
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      onboarding.closeIntroModal();
      gitSync.CreateNConnectToGit(repoName1, true, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName1 = repName;
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      onboarding.closeIntroModal();
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
      gitSync.CreateNConnectToGit(repoName4, false, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName4 = repName;
      });
      if (CURRENT_REPO === REPO.CE) {
        cy.get(gitSync.locators.repoLimitErrorModal).should("exist");

        // title and info text checking
        cy.get(gitSync.locators.repoLimitErrorModal).contains(
          Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED(),
        );
        cy.get(gitSync.locators.repoLimitErrorModal).contains(
          Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED_INFO(),
        );
        cy.get(gitSync.locators.repoLimitErrorModal).contains(
          Cypress.env("MESSAGES").CONTACT_SUPPORT_TO_UPGRADE(),
        );
        cy.get(locators._link).should("contain.text", "Contact support");
        cy.get(gitSync.locators.repoLimitErrorModal).contains(
          Cypress.env("MESSAGES").REVOKE_CAUSE_APPLICATION_BREAK(),
        );

        // learn more link checking
        cy.window().then((window) => {
          windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
            expect(url.startsWith("https://docs.appsmith.com/")).to.be.true;
            windowOpenSpy.restore();
          });
        });
        cy.get(locators._link).contains("Learn more").click();

        cy.get(gitSync.locators.repoLimitErrorModalConnectedArtifact).should(
          "have.length",
          3,
        );
        cy.get(gitSync.locators.repoLimitErrorModalDisconnectLink)
          .first()
          .click();

        cy.get(gitSync.locators.repoLimitErrorModal).should("not.exist");
        cy.get(gitSync.locators.disconnectModal).should("exist");

        agHelper.GetNClick(gitSync.locators.disconnectModalCloseBtn);
        cy.get(gitSync.locators.disconnectModal).should("not.exist");
      }
    });

    after(() => {
      homePage.DeleteAppviaAPI(repoName1);
      homePage.DeleteAppviaAPI(repoName2);
      homePage.DeleteAppviaAPI(repoName3);
      homePage.DeleteAppviaAPI(repoName4);
      gitSync.DeleteTestGithubRepo(repoName1);
      gitSync.DeleteTestGithubRepo(repoName2);
      gitSync.DeleteTestGithubRepo(repoName3);
      gitSync.DeleteTestGithubRepo(repoName4);
    });
  },
);
