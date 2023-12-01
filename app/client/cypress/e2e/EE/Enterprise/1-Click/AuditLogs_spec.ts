import locators from "../../../../locators/AuditLogsLocators";
import {
  featureFlagIntercept,
  featureFlagInterceptForLicenseFlags,
} from "../../../../support/Objects/FeatureFlags";
import { agHelper, license } from "../../../../support/ee/ObjectsCore_EE";

describe("Audit Logs- 1 Click", () => {
  beforeEach(() => {
    featureFlagInterceptForLicenseFlags();
  });
  it("1. Super Users on Free plan should see upgrade page", () => {
    license.RemoveLicenseKey();
    agHelper.Sleep(4000);
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.AssertElementVisibility(locators.AdminSettingsEntryLink);
    agHelper.GetNClick(locators.AdminSettingsEntryLink);
    agHelper.AssertURL("settings/general");
    agHelper.AssertElementVisibility(locators.LeftPaneAuditLogsLink);
    agHelper.GetNClick(locators.LeftPaneAuditLogsLink);
    cy.stubPricingPage();
    agHelper.AssertElementVisibility(locators.upgradeContainer);
    agHelper.GetNAssertElementText(
      locators.upgradeContainer,
      "Upgrade",
      "contain.text",
    );
    agHelper.GetNClick(locators.upgradeButton);
    cy.get("@pricingPage").should("be.called");
    cy.wait(2000);
    cy.go(-1);
  });
  it("2. Super Users on Paid plan should see Audit Logs", () => {
    license.RemoveLicenseKey();
    agHelper.Sleep(4000);
    license.UpdateLicenseKey("business");
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.AssertElementVisibility(locators.AdminSettingsEntryLink);
    agHelper.GetNClick(locators.AdminSettingsEntryLink);
    agHelper.AssertURL("settings/general");
    agHelper.AssertElementVisibility(locators.LeftPaneAuditLogsLink);
    agHelper.GetNClick(locators.LeftPaneAuditLogsLink);
    agHelper.AssertElementAbsence(locators.upgradeContainer);
    agHelper.AssertElementAbsence(locators.upgradeButton);
  });
  after(() => {
    featureFlagIntercept({}, true);
  });
});
