import homePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Git import empty repository", function () {
  let repoName;
  const assertConnectFailure = true;
  const failureMessage =
    "git import failed. \nDetails: Cannot import app from an empty repo";
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;
      _.gitSync.CreateTestGiteaRepo(repoName);
      //cy.createTestGithubRepo(repoName);
    });
  });

  it("Bug #12749 Git Import - Empty Repo NullPointerException", () => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon).first().click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card").next().click();
    cy.generateUUID().then((uid) => {
      repoName = uid;
      //cy.createTestGithubRepo(repoName);
      _.gitSync.CreateTestGiteaRepo(repoName);
      cy.importAppFromGit(repoName, true, failureMessage);
    });
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });
  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
    //cy.deleteTestGithubRepo(repoName);
  });
});
