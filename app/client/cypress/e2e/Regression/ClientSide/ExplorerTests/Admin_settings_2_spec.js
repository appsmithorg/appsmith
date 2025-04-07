/// <reference types="cypress-tags" />
import adminsSettings from "../../../../locators/AdminsSettings";
import { adminSettings as adminSettingsHelper } from "../../../../support/Objects/ObjectsCore";

const {
  GOOGLE_MAPS_SETUP_DOC,
} = require("../../../../../src/constants/ThirdPartyConstants");

describe(
  "Admin settings page",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    it("1. should test that configure link redirects to google maps setup doc", () => {
      cy.visit(adminSettingsHelper.routes.INSTANCE_SETTINGS, {
        timeout: 60000,
      });
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click()
          .wait(3000); //for page to load fully;
        cy.url().should("contain", GOOGLE_MAPS_SETUP_DOC);
      });
    });

    it(
      "airgap",
      "2. should test that authentication page redirects and google and github auth doesn't exist - airgap",
      () => {
        cy.visit(adminSettingsHelper.routes.GENERAL, { timeout: 60000 });
        cy.get(adminsSettings.authenticationTab).click();
        cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
        cy.get(adminsSettings.googleButton).should("not.exist");
        cy.get(adminsSettings.githubButton).should("not.exist");
        cy.get(adminsSettings.formloginButton).click();
        cy.url().should("contain", adminSettingsHelper.routes.FORMLOGIN);
      },
    );

    it(
      "airgap",
      "5. should test that read more on version is hidden for airgap",
      () => {
        cy.visit(adminSettingsHelper.routes.GENERAL, { timeout: 60000 });
        cy.get(adminsSettings.versionTab).click();
        cy.url().should("contain", adminSettingsHelper.routes.VERSION);
        cy.get(adminsSettings.readMoreLink).should("not.exist");
      },
    );

    it("6. should test that settings page is not accessible to normal users", () => {
      cy.LogOut(false);
      cy.wait(2000);
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME3"),
        Cypress.env("TESTPASSWORD3"),
      );
      cy.get(".admin-settings-menu-option").should("not.exist");
      cy.visit(adminSettingsHelper.routes.GENERAL, { timeout: 60000 });
      // non super users are redirected to home page
      cy.url().should("contain", adminSettingsHelper.routes.APPLICATIONS);
      cy.LogOut(false);
    });
  },
);
