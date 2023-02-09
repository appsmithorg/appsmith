const EnterpriseAdminSettingsLocators = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import adminsSettings from "../../../../locators/AdminsSettings";

describe("Admin settings page", function() {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
  });

  it("should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait(3000);
    cy.visit("/settings");
    cy.url().should("contain", "/settings/general");
  });

  it("should test that authentication page shows upgrade button for SSO", () => {
    cy.visit("/settings/general");
    cy.get(adminsSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    if (Cypress.env("Edition") === 0) {
      cy.get(EnterpriseAdminSettingsLocators.upgradeOidcButton)
        .should("be.visible")
        .should("contain", "UPGRADE");
      cy.get(EnterpriseAdminSettingsLocators.upgradeSamlButton)
        .should("be.visible")
        .should("contain", "UPGRADE");
    }
  });

  it("should test that Appsmith Watermark setting shows upgrade button", () => {
    cy.visit("/settings/general");

    if (Cypress.env("Edition") === 0) {
      // checking if the setting contains a word 'Upgrade
      cy.get(
        EnterpriseAdminSettingsLocators.hideAppsmithWatermarkSetting,
      ).contains("UPGRADE");
    }
  });
});
