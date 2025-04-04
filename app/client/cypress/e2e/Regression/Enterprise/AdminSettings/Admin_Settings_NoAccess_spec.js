const EnterpriseAdminSettingsLocators = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import adminsSettings from "../../../../locators/AdminsSettings";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import {
  agHelper,
  adminSettings as adminSettingsHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Admin settings page", { tags: ["@tag.Settings"] }, function () {
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
    cy.url().should("contain", adminSettingsHelper.routes.PROFILE);
  });

  it("2. should test that all business and enterprise general settings should have resp. tag and should be disabled", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );
    if (CURRENT_REPO === REPO.CE) {
      cy.get(adminsSettings.hideWatermarkWrapper).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.hideWatermarkInput).should("have.attr", "disabled");

      cy.get(adminsSettings.userSettingsTab).click();
      cy.get(adminsSettings.showRolesAndGroupsWrapper).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.showRolesAndGroupsInput).should(
        "have.attr",
        "disabled",
      );

      cy.get(adminsSettings.singleSessionPerUserWrapper).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.singleSessionPerUserInput).should(
        "have.attr",
        "disabled",
      );

      cy.get(adminsSettings.sessionTimeoutWrapper).within(() => {
        cy.get(adminsSettings.enterpriseTag)
          .should("exist")
          .should("contain", "Enterprise");
      });
      cy.get(adminsSettings.sessionTimeoutInput).should(
        "have.attr",
        "disabled",
      );
    }
  });

  it("3. should test that authentication and branding page shows upgrade button and redirects to pricing page", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );
    cy.get(adminsSettings.authenticationTab).click();
    cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
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
      cy.stubCustomerPortalPage();
      cy.get(adminsSettings.branding).click();
      cy.url().should("contain", adminSettingsHelper.routes.BRANDING);
      cy.get(adminsSettings.brandingSubmitButton).should("be.disabled");
      agHelper.GetNClick(adminsSettings.upgrade);
      cy.get("@customerPortalPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });

  it("4. should test that Business features shows upgrade button and direct to pricing page", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );
    if (CURRENT_REPO === REPO.CE) {
      cy.get(adminsSettings.accessControl).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.accessControl).click();
      cy.url().should("contain", adminSettingsHelper.routes.ACCESS_CONTROL);
      cy.stubCustomerPortalPage();
      agHelper.GetNClick(adminsSettings.upgrade);
      cy.get("@customerPortalPage").should("be.called");
      cy.wait(2000);
      agHelper.VisitNAssert(
        adminSettingsHelper.routes.GENERAL,
        "getEnvVariables",
      );
      cy.get(adminsSettings.auditLogs).within(() => {
        cy.get(adminsSettings.businessTag)
          .should("exist")
          .should("contain", "Business");
      });
      cy.get(adminsSettings.auditLogs).click();
      cy.url().should("contain", adminSettingsHelper.routes.AUDIT_LOGS);
      cy.stubCustomerPortalPage();
      agHelper.GetNClick(adminsSettings.upgrade);
      cy.get("@customerPortalPage").should("be.called");
      cy.wait(2000);
      agHelper.VisitNAssert(
        adminSettingsHelper.routes.GENERAL,
        "getEnvVariables",
      );
      cy.get(adminsSettings.provisioning).within(() => {
        cy.get(adminsSettings.enterpriseTag)
          .should("exist")
          .should("contain", "Enterprise");
      });
      cy.get(adminsSettings.provisioning).click();
      cy.url().should("contain", adminSettingsHelper.routes.PROVISIONING);
      cy.stubPricingPage();
      agHelper.GetNClick(adminsSettings.upgrade);
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    }
  });
});
