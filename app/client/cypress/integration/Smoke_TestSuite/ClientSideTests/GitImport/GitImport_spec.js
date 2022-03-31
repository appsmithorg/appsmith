import gitSyncLocators from "../../../../locators/gitSyncLocators";
const homePage = require("../../../../locators/HomePage");
let repoName;

describe("Git import flow", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    });
  });
  it("Import an app from git in the same organization", () => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
      cy.get(homePage.homeIcon).click();
      cy.get(homePage.optionsIcon)
        .first()
        .click();
      cy.get(homePage.orgImportAppOption).click({ force: true });
      cy.get(".t--import-json-card")
        .next()
        .click();
      cy.importAppFromGit(repoName);
      cy.wait(2000);
    });
  });
  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
