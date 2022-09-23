const adminSettings = require("../../../../locators/AdminsSettings");
const enterpriseSettings = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
import homePage from "../../../../locators/HomePage";

describe("SSO with SAML test functionality", function() {
  it("1. Go to admin settings and enable SAML via Metadata URL", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "ENABLE");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign In with SAML SSO",
    );
  });

  it("2. Go to admin settings and disable SAML", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "EDIT");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });

  it("3. Go to admin settings and enable SAML via Metadata XML", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "ENABLE");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign In with SAML SSO",
    );
  });

  it("4. Go to admin settings and disable SAML", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "EDIT");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });

  it("5. Go to admin settings and enable SAML via IDP data", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "ENABLE");
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
    cy.fillSamlForm("IDP");
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is enabled
    cy.get(enterpriseSettings.loginWithSAML).should(
      "have.text",
      "Sign In with SAML SSO",
    );
  });

  it("6. Go to admin settings and disable SAML", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    // click authentication tab
    cy.get(adminSettings.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(enterpriseSettings.samlButton)
      .should("be.visible")
      .should("contain", "EDIT");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with saml is disabled
    cy.get(enterpriseSettings.loginWithSAML).should("not.exist");
  });
});
