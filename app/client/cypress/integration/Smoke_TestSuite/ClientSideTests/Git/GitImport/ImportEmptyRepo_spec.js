import homePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

describe("Git import empty repository", function() {
  let repoName;
  const assertConnectFailure = true;
  const failureMessage =
    "git import failed. \nDetails: Cannot import app from an empty repo";

  it("Bug #12749 Git Import - Empty Repo NullPointerException", () => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card")
      .next()
      .click();
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.importAppFromGit(repoName, true, failureMessage);
    });
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });
  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
