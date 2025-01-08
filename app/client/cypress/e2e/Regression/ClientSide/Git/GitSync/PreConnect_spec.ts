import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Pre git connection spec:",
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
    it("1. Deploy menu at the application dropdown menu", () => {
      // create new app
      _.homePage.NavigateToHome();
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
      _.agHelper.GetNClick(_.locators._publishButton);
      cy.wait("@publishApp");

      // current deployed version
      _.agHelper.GetNClick(homePage.deployPopupOptionTrigger);
      _.agHelper.AssertElementExist(homePage.currentDeployedPreviewBtn);

      // connect to git
      _.agHelper.GetNClick(_.gitSync.locators.deployMenuConnect);
      _.agHelper.AssertElementVisibility(_.gitSync.locators.connectModal);
      _.gitSync.CloseConnectModal();

      cy.get(_.gitSync.locators.quickActionConnectBtn).click();
      _.agHelper.AssertElementVisibility(_.gitSync.locators.connectModal);
      _.gitSync.CloseConnectModal();
    });
  },
);
