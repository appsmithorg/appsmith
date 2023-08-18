const EnterpriseAdminSettingsLocators = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import adminsSettings from "../../../../locators/AdminsSettings";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

describe("Admin settings page", function () {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
    cy.intercept("PUT", "/api/v1/tenants", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postTenantConfig");
  });

  it("1. should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    //cy.wait(3000);
    cy.visit("/settings", { timeout: 60000 });
    cy.url().should("contain", "/settings/general");
  });

  it("2. should test that authentication and branding page shows upgrade button and redirects to pricing page", () => {
    cy.visit("/settings/general", { timeout: 60000 });
    cy.get(adminsSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    if (CURRENT_REPO === REPO.CE) {
      cy.stubPricingPage();
      cy.get(EnterpriseAdminSettingsLocators.upgradeOidcButton)
        .should("be.visible")
        .should("contain", "Upgrade")
        .click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.stubPricingPage();
      cy.get(EnterpriseAdminSettingsLocators.upgradeSamlButton)
        .should("be.visible")
        .should("contain", "Upgrade")
        .click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.stubPricingPage();
      cy.get(".t--settings-category-branding").click();
      cy.url().should("contain", "/settings/branding");
      cy.get(adminsSettings.brandingSubmitButton).should("be.disabled");
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });

  it("3. should test that Business features shows upgrade button and direct to pricing page", () => {
    cy.visit("/settings/general", { timeout: 60000 });
    if (CURRENT_REPO === REPO.CE) {
      cy.get(adminsSettings.accessControl).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.accessControl).click();
      cy.url().should("contain", "/settings/access-control");
      cy.stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.get(adminsSettings.auditLogs).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.auditLogs).click();
      cy.url().should("contain", "/settings/audit-logs");
      cy.stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.get(adminsSettings.provisioning).within(() => {
        cy.get(adminsSettings.enterpriseTag)
          .should("exist")
          .should("contain", "Enterprise");
      });
      cy.get(adminsSettings.provisioning).click();
      cy.url().should("contain", "/settings/provisioning");
      cy.stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });
});
