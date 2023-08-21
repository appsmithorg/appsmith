import adminSettings from "../../../../locators/AdminsSettings";
const enterpriseSettings = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import homePage from "../../../../locators/HomePage";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("SSO with SAML test functionality", function () {
  it("1. Authentication Settings should show upgrade when the user is on a free plan", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    featureFlagIntercept({ license_sso_saml_enabled: false });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.stubPricingPage();
    cy.get(enterpriseSettings.upgradeSamlButton)
      .should("be.visible")
      .should("contain", "Upgrade");
    cy.get(enterpriseSettings.upgradeSamlButton).click();
    cy.get("@pricingPage").should("be.called");
    cy.wait(2000);
    cy.go(-1);
  });
  it("2. Go to admin settings and enable SAML via Metadata URL", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    featureFlagIntercept({ license_sso_saml_enabled: true });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Enable");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.samlUrlTab).should("be.visible");
    cy.get(enterpriseSettings.samlUrlTab).click();
    // fill saml form
    cy.fillSamlForm("URL");
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart

    cy.waitUntil(() =>
      cy
        .contains("Authentication successful!", { timeout: 180000 })
        .should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).should("be.visible");
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign in with SAML SSO",
    );
  });

  it("3. Go to admin settings and disable SAML", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    featureFlagIntercept({ license_sso_saml_enabled: true });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Edit");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.disconnectBtn)
      .should("be.visible")
      .should("contain", "Disconnect");
    cy.get(enterpriseSettings.disconnectBtn)
      .click()
      .should("contain", "Are you sure?");
    cy.get(enterpriseSettings.disconnectBtn).click();

    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy.contains("SAML 2.0", { timeout: 180000 }).should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).should("be.visible");
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });

  it("4. Go to admin settings and enable SAML via Metadata XML", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");

    featureFlagIntercept({ license_sso_saml_enabled: true });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Enable");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.samlXmlTab).should("be.visible");
    cy.get(enterpriseSettings.samlXmlTab).click();
    // fill saml form
    cy.fillSamlForm("XML");
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy
        .contains("Authentication successful!", { timeout: 180000 })
        .should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign in with SAML SSO",
    );
  });

  it("5. Go to admin settings and disable SAML", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();

    featureFlagIntercept({ license_sso_saml_enabled: true });
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Edit");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.disconnectBtn)
      .should("be.visible")
      .should("contain", "Disconnect");
    cy.get(enterpriseSettings.disconnectBtn)
      .click()
      .should("contain", "Are you sure?");
    cy.get(enterpriseSettings.disconnectBtn).click();

    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy.contains("SAML 2.0", { timeout: 180000 }).should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });

  it("6. Go to admin settings and enable SAML via IdP data", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");

    featureFlagIntercept({ license_sso_saml_enabled: true });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Enable");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.samlIdpTab).should("be.visible");
    cy.get(enterpriseSettings.samlIdpTab).click();
    // fill saml form
    cy.fillSamlForm("IdP");
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy
        .contains("Authentication successful!", { timeout: 180000 })
        .should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign in with SAML SSO",
    );
  });

  it("7. Go to admin settings and disable SAML", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");

    featureFlagIntercept({ license_sso_saml_enabled: true });
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "Edit");
    cy.get(enterpriseSettings.samlButton).click();
    cy.wait(2000);
    cy.intercept(
      {
        url: "api/v1/admin/sso/saml",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.get(enterpriseSettings.disconnectBtn)
      .should("be.visible")
      .should("contain", "Disconnect");
    cy.get(enterpriseSettings.disconnectBtn)
      .click()
      .should("contain", "Are you sure?");
    cy.get(enterpriseSettings.disconnectBtn).click();

    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy.contains("SAML 2.0", { timeout: 180000 }).should("be.visible"),
    );
    cy.wait(1000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is disabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });
});
