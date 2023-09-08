import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import settings from "../../../../locators/EnterpriseAdminSettingsLocators.json";
import { agHelper } from "../../../../support/Objects/ObjectsCore";

describe("General Settings", () => {
  it("1. Superuser on free plan should see Programatic Access Control Option which is disabled", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.AssertElementVisibility(settings.adminSettingsEntryLink);
    agHelper.GetNClick(settings.adminSettingsEntryLink);
    agHelper.AssertURL("settings/general");

    featureFlagIntercept({ license_pac_enabled: false });

    cy.wait(2000);

    agHelper.AssertElementExist(settings.programaticAccessControlDiv);
    agHelper.AssertElementEnabledDisabled(
      settings.programaticAccessControlInput,
      0,
      true,
    );
  });
  it("2. Superuser on paid plan should see Programatic Access Control Option which is not disabled", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.AssertElementVisibility(settings.adminSettingsEntryLink);
    agHelper.GetNClick(settings.adminSettingsEntryLink);
    agHelper.AssertURL("settings/general");

    featureFlagIntercept({ license_pac_enabled: true });

    cy.wait(2000);

    agHelper.AssertElementExist(settings.programaticAccessControlDiv);
    agHelper.AssertElementEnabledDisabled(
      settings.programaticAccessControlInput,
      0,
      false,
    );
  });
});
