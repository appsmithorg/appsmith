import {
  agHelper,
  appSettings,
  deployMode,
  embedSettings,
} from "../../../../support/Objects/ObjectsCore";
import applicationLocators from "../../../../locators/Applications.json";

describe(
  "Fork application in deployed mode",
  {
    tags: ["@tag.Fork", "@tag.Datasource", "@tag.Git", "@tag.Table", "@tag.JS"],
  },
  function () {
    it("1. Fork modal should open and close", function () {
      appSettings.OpenAppSettings();
      appSettings.GoToEmbedSettings();
      embedSettings.ToggleMarkForkable();
      embedSettings.TogglePublicAccess();
      deployMode.DeployApp();

      cy.url().then((url) => {
        const forkableAppUrl = url;
        cy.LogOut();
        cy.LoginFromAPI(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
        );
        cy.visit(forkableAppUrl);

        agHelper.GetNClick(applicationLocators.forkButton);
        agHelper.AssertElementVisibility(applicationLocators.forkModal);
        cy.location("search").should("include", "fork=true");
        agHelper.GetNClick(applicationLocators.closeModalPopup);
        cy.location("search").should("not.include", "fork=true");
      });
    });
  },
);
