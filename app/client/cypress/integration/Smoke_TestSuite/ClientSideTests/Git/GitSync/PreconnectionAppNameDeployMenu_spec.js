import homePage from "../../../../../locators/HomePage";
const commonLocators = require("../../../../../locators/commonlocators.json");
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

describe("Pre git connection spec:", function() {
  it("deploy menu at the application dropdown menu", () => {
    // create new app
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");

    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        expect(!!url).to.be.true;
      });
    });

    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuPublish).click();
    cy.wait("@publishApp");

    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuCurrentVersion).click();

    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuConnectToGit).click();
    cy.get(gitSyncLocators.gitSyncModal);
    cy.contains("Git Connection")
      .parent()
      .should("have.class", "react-tabs__tab--selected");

    cy.get(gitSyncLocators.closeGitSyncModal).click();

    cy.get(gitSyncLocators.connectGitBottomBar).click();
    cy.get(gitSyncLocators.gitSyncModal);
    cy.contains("Git Connection")
      .parent()
      .should("have.class", "react-tabs__tab--selected");
  });
});
