import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import rbac from "../../../../../locators/RBAClocators.json";

describe("RBAC Admin Settings", () => {
  it("1. Superuser on free plan should see Upgrade Page", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(rbac.adminSettingsEntryLink).should("be.visible");
    cy.get(rbac.adminSettingsEntryLink).click();
    cy.url().should("contain", "/settings/general");

    featureFlagIntercept({ license_gac_enabled: false });

    cy.wait(2000);

    cy.get(rbac.usersTab).should("not.be.exist");
    cy.get(rbac.rolesTab).should("not.be.exist");
    cy.get(rbac.groupsTab).should("not.be.exist");

    cy.get(rbac.accessControlTab).should("be.visible");
    cy.get(rbac.accessControlTab).click();

    cy.stubPricingPage();
    cy.get(rbac.upgradeContainer).should("be.visible");
    cy.get(rbac.upgradeButton)
      .should("be.visible")
      .should("have.text", "Upgrade");

    cy.get(rbac.upgradeButton).click();
    cy.get("@pricingPage").should("be.called");
    cy.wait(2000);
    cy.go(-1);
  });
});
