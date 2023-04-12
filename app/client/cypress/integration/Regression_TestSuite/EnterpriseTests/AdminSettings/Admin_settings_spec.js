const EnterpriseAdminSettingsLocators = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import adminsSettings from "../../../../locators/AdminsSettings";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

function stubPricingPage() {
  cy.window().then((win) => {
    cy.stub(win, "open", (url) => {
      win.location.href = "https://www.appsmith.com/pricing?";
    }).as("pricingPage");
  });
}
describe("Admin settings page", function () {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
  });

  it("1. should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait(3000);
    cy.visit("/settings");
    cy.url().should("contain", "/settings/general");
  });

  it("2. should test that authentication and branding page shows upgrade button and redirects to pricing page", () => {
    cy.visit("/settings/general");
    cy.get(adminsSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    if (CURRENT_REPO === REPO.CE) {
      stubPricingPage();
      cy.get(EnterpriseAdminSettingsLocators.upgradeOidcButton)
        .should("be.visible")
        .should("contain", "UPGRADE")
        .click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      stubPricingPage();
      cy.get(EnterpriseAdminSettingsLocators.upgradeSamlButton)
        .should("be.visible")
        .should("contain", "UPGRADE")
        .click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      stubPricingPage();
      cy.get(".t--settings-category-branding").click();
      cy.url().should("contain", "/settings/branding");
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });
  it("3. should test that Business features shows upgrade button and direct to pricing page", () => {
    cy.visit("/settings/general");
    if (CURRENT_REPO === REPO.CE) {
      cy.get(adminsSettings.accessControl).click();
      cy.url().should("contain", "/settings/access-control");
      stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.get(adminsSettings.auditLogs).click();
      cy.url().should("contain", "/settings/audit-logs");
      stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
      cy.get(adminsSettings.upgrageLeftPane).click();
      cy.url().should("contain", "/settings/business-edition");
      stubPricingPage();
      cy.xpath(adminsSettings.upgrade).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });
});
