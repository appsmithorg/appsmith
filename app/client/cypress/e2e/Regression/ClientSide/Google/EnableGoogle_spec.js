import adminSettings from "../../../../locators/AdminsSettings";
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
import { adminSettings as adminSettingsHelper } from "../../../../support/Objects/ObjectsCore";

describe(
  "SSO with Google test functionality",
  { tags: ["@tag.Authentication", "@tag.excludeForAirgap"] },
  function () {
    it("1. Go to admin settings and enable Google with not all mandatory fields filled", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", adminSettingsHelper.routes.GENERAL);
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
      cy.get(adminSettings.googleButton)
        .should("be.visible")
        .should("contain", "Enable");
      cy.get(adminSettings.googleButton).click();
      cy.wait(2000);
      // fill google form
      cy.fillGoogleFormPartly();
      cy.get(commonlocators.toastBody).should("be.visible");
      cy.get(commonlocators.toastBody).should(
        "contain",
        "Mandatory fields cannot be empty",
      );
    });

    it("2. Go to admin settings and enable Google", function () {
      cy.LogOut(false);
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", adminSettingsHelper.routes.GENERAL);
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
      cy.get(adminSettings.googleButton)
        .should("be.visible")
        .should("contain", "Enable");
      cy.get(adminSettings.googleButton).click();
      cy.wait(2000);
      // fill google form
      cy.fillGoogleForm();
      cy.wait(2000);
      // assert server is restarting
      cy.get(adminSettings.restartNotice).should("be.visible");
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy
          .contains("Google authentication", { timeout: 180000 })
          .should("be.visible"),
      );
      cy.wait(1000);
      cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
      cy.get(homePage.profileMenu).click();
      cy.get(homePage.signOutIcon).click();
      cy.wait(500);
      // validating sso with google is enabled
      cy.get(adminSettings.loginWithGoogle).should("have.text", "Google");
    });

    it("3. Go to admin settings and disable Google", function () {
      cy.LogOut(false);
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", adminSettingsHelper.routes.GENERAL);
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
      cy.get(adminSettings.googleButton)
        .should("be.visible")
        .should("contain", "Edit");
      cy.get(adminSettings.googleButton).click();
      cy.wait(2000);
      cy.get(adminSettings.disconnectBtn)
        .should("be.visible")
        .should("contain", "Disconnect");
      cy.get(adminSettings.disconnectBtn)
        .click()
        .should("contain", "Are you sure?");
      cy.get(adminSettings.disconnectBtn).click();

      // assert server is restarting
      cy.get(adminSettings.restartNotice).should("be.visible");
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy
          .contains("Google authentication", { timeout: 180000 })
          .should("be.visible"),
      );
      cy.wait(1000);
      cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
      cy.get(homePage.profileMenu).click();
      cy.get(homePage.signOutIcon).click();
      cy.wait(500);
      // validating sso with google is disabled
      cy.get(adminSettings.loginWithGoogle).should("not.exist");
    });
  },
);
