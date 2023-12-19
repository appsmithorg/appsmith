import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
const enterpriseSettings = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import adminSettingsLoc from "../../../../locators/AdminsSettings";
import homePageLoc from "../../../../locators/HomePage";
import rbacloc from "../../../../locators/RBAClocators.json";

import {
  rbacHelper,
  agHelper,
  dataManager,
  homePage,
} from "../../../../support/ee/ObjectsCore_EE";

describe("SSO test", { tags: ["@tag.Authentication"] }, () => {
  it("1. Go to admin settings and enable OIDC", function () {
    homePage.NavigateToHome();
    agHelper.GetNClick(rbacloc.adminSettingsEntryLink);
    agHelper.AssertURL("/settings/general");
    featureFlagIntercept({ license_sso_oidc_enabled: true });
    // click authentication tab
    agHelper.GetNClick(adminSettingsLoc.authenticationTab);
    agHelper.AssertURL("/settings/authentication");
    agHelper.AssertContains("Enable", "exist", enterpriseSettings.oidcButton);

    agHelper.GetNClick(enterpriseSettings.oidcButton);
    // fill oidc form
    rbacHelper.fillOIDCForm();

    // assert server is restarting
    agHelper.AssertElementVisibility(adminSettingsLoc.restartNotice);

    // adding wait for server to restart
    agHelper.waitUntilTextVisible("OpenID connect", 180000);
    agHelper.WaitUntilEleAppear(homePageLoc.profileMenu);
    homePage.Signout();
    agHelper.AssertContains(
      "Sign in with OIDC SSO",
      "exist",
      enterpriseSettings.loginWithOIDC,
    );
  });

  it("2. Test if sso user is able to login", () => {
    logUsingAuth0(
      dataManager.dsValues[dataManager.defaultEnviorment].okta_username,
      Cypress.env("APPSMITH_OAUTH2_OIDC_OKTA_PASSWORD"),
    );
  });

  it("3. Go to admin settings and disable OIDC", function () {
    homePage.LogOutviaAPI();
    cy.reload();
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.GetNClick(rbacloc.adminSettingsEntryLink);
    agHelper.AssertURL("/settings/general");
    featureFlagIntercept({ license_sso_oidc_enabled: true });
    // click authentication tab
    agHelper.GetNClick(adminSettingsLoc.authenticationTab);
    agHelper.AssertURL("/settings/authentication");
    agHelper.AssertContains("Edit", "exist", enterpriseSettings.oidcButton);

    agHelper.GetNClick(enterpriseSettings.oidcButton);

    // click disconnect button
    agHelper.GetNClick(adminSettingsLoc.disconnectBtn);
    // click are you sure button (both has same locator)
    agHelper.GetNClick(adminSettingsLoc.disconnectBtn);
    agHelper.AssertElementVisibility(adminSettingsLoc.restartNotice);
    agHelper.waitUntilTextVisible("OpenID connect", 180000);
    homePage.Signout();
    // validating sso with oidc is disabled
    agHelper.AssertElementAbsence(enterpriseSettings.loginWithOIDC);
  });
});

function logUsingAuth0(username: string, password: string) {
  Cypress.on("uncaught:exception", (err) => {
    return false;
  });
  cy.session("session to login using okta", () => {
    cy.visit("http://localhost/");
    agHelper.GetNClick(enterpriseSettings.loginWithOIDC);
    cy.origin(
      Cypress.env("APPSMITH_OAUTH2_OIDC_DIRECT_URL"),
      {
        args: {
          username,
          password,
        },
      },
      ({ password, username }) => {
        cy.get('[name="identifier"]').type(username);
        cy.get('[name="credentials.passcode"]').type(password, {
          log: false,
        });
        cy.get('[value="Sign in"]').click({ force: true }).wait(4000);
      },
    );
  });
}
