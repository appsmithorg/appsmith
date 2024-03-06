import adminSettings from "../../../../locators/AdminsSettings";
const enterpriseSettings = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "SSO with OIDC test functionality",
  { tags: ["@tag.Authentication"] },
  function () {
    it("1. Authentication Settings should show upgrade when the user is on a free plan", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", "/settings/general");
      featureFlagIntercept({ license_sso_oidc_enabled: false });
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.stubPricingPage();
      cy.get(enterpriseSettings.upgradeOidcButton)
        .should("be.visible")
        .should("contain", "Upgrade");
      cy.get(enterpriseSettings.upgradeOidcButton).click();
      cy.get("@pricingPage").should("be.called");
      cy.wait(2000);
      cy.go(-1);
    });
    it("2. Go to admin settings and enable OIDC with not all mandatory fields filled", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", "/settings/general");
      featureFlagIntercept({ license_sso_oidc_enabled: true });
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(enterpriseSettings.oidcButton)
        .should("be.visible")
        .should("contain", "Enable");
      cy.get(enterpriseSettings.oidcButton).click();
      cy.wait(2000);
      // fill oidc form
      cy.fillOIDCFormPartly();
      cy.get(commonlocators.toastBody).should("be.visible");
      cy.get(commonlocators.toastBody).should(
        "contain",
        "Mandatory fields cannot be empty",
      );
    });

    it("3. Go to admin settings and enable OIDC", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", "/settings/general");
      featureFlagIntercept({ license_sso_oidc_enabled: true });
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(enterpriseSettings.oidcButton)
        .should("be.visible")
        .should("contain", "Enable");
      cy.get(enterpriseSettings.oidcButton).click();
      cy.wait(2000);
      // fill oidc form
      cy.fillOIDCform();
      cy.wait(2000);
      // assert server is restarting
      cy.get(adminSettings.restartNotice).should("be.visible");
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy.contains("OpenID connect", { timeout: 180000 }).should("be.visible"),
      );
      cy.wait(1000);
      cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
      cy.get(adminSettings.disconnectBtn)
        .scrollIntoView()
        .should("be.visible")
        .should("contain", "Disconnect");
      cy.get(homePage.profileMenu).click();
      cy.get(homePage.signOutIcon).click();
      cy.wait(500);
      // validating sso with oidc is enabled
      cy.get(enterpriseSettings.loginWithOIDC).should(
        "have.text",
        "Sign in with OIDC SSO",
      );
    });

    it("4. Go to admin settings and disable OIDC", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.get(".admin-settings-menu-option").should("be.visible");
      cy.get(".admin-settings-menu-option").click();
      cy.url().should("contain", "/settings/general");
      featureFlagIntercept({ license_sso_oidc_enabled: true });
      // click authentication tab
      cy.get(adminSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(enterpriseSettings.oidcButton)
        .should("be.visible")
        .should("contain", "Edit");
      cy.get(enterpriseSettings.oidcButton).click();
      cy.wait(2000);
      cy.get(`[data-testid="admin-settings-group-wrapper"]`)
        .parent()
        .parent()
        .scrollTo("bottom", {
          ensureScrollable: false,
        });
      cy.get(adminSettings.disconnectBtn)
        .should("be.visible")
        .should("contain", "Disconnect");
      cy.get(adminSettings.disconnectBtn)
        .click()
        .should("contain", "Are you sure?");
      cy.get(adminSettings.disconnectBtn).click();

      // assert server is restarting
      cy.get(adminSettings.restartNotice).should("be.visible");
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy.contains("OpenID connect", { timeout: 180000 }).should("be.visible"),
      );
      cy.wait(1000);
      cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
      cy.get(homePage.profileMenu).click();
      cy.get(homePage.signOutIcon).click();
      cy.wait(500);
      // validating sso with oidc is disabled
      cy.get(enterpriseSettings.loginWithOIDC).should("not.exist");
    });
  },
);
