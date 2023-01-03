import homePage from "../../../../../locators/HomePage";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

const agHelper = ObjectsRegistry.AggregateHelper,
  commonLocators = ObjectsRegistry.CommonLocators;

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

    // deploy
    agHelper.GetNClick(commonLocators._publishButton);
    cy.wait("@publishApp");

    // current deployed version
    agHelper.GetNClick(homePage.deployPopupOptionTrigger);
    agHelper.AssertElementExist(homePage.currentDeployedPreviewBtn);

    // connect to git
    agHelper.GetNClick(homePage.connectToGitBtn);

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
