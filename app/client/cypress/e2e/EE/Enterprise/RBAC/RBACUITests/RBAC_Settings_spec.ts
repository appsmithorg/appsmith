import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import rbac from "../../../../../locators/RBAClocators.json";
import { agHelper } from "../../../../../support/Objects/ObjectsCore";

describe("RBAC Admin Settings", { tags: ["@tag.AccessControl"] }, () => {
  it("1. Superuser on free plan should see Upgrade Page", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.AssertElementVisibility(rbac.adminSettingsEntryLink, true);
    agHelper.GetNClick(rbac.adminSettingsEntryLink);
    agHelper.AssertURL("settings/general");

    featureFlagIntercept({ license_gac_enabled: false });

    cy.wait(2000);

    agHelper.AssertElementAbsence(rbac.usersTab);
    agHelper.AssertElementAbsence(rbac.rolesTab);
    agHelper.AssertElementAbsence(rbac.groupsTab);

    agHelper.AssertElementVisibility(rbac.accessControlTab, true);
    agHelper.GetNClick(rbac.accessControlTab);

    cy.stubPricingPage();

    agHelper.AssertElementVisibility(rbac.upgradeContainer, true);
    agHelper.AssertElementVisibility(rbac.upgradeButton, true);
    agHelper.AssertText(rbac.upgradeButton, "text", "Upgrade");

    agHelper.GetNClick(rbac.upgradeButton);

    cy.get("@pricingPage").should("be.called");
    cy.wait(2000);
    cy.go(-1);
  });
});
