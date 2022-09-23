const adminSettings = require("../../../../locators/AdminsSettings");
const enterpriseSettings = require("../../../../locators/EnterpriseAdminSettingsLocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";

describe("SSO with OIDC test functionality", function() {
  it("1. Go to admin settings and enable OIDC with not all mandatory fields filled", function() {
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
    cy.get(enterpriseSettings.oidcButton)
      .should("be.visible")
      .should("contain", "ENABLE");
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

  it("2. Go to admin settings and enable OIDC", function() {
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
    cy.get(enterpriseSettings.oidcButton)
      .should("be.visible")
      .should("contain", "ENABLE");
    cy.get(enterpriseSettings.oidcButton).click();
    cy.wait(2000);
    // fill oidc form
    cy.fillOIDCform();
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with oidc is enabled
    cy.get(enterpriseSettings.loginWithOIDC).should(
      "have.text",
      "Sign In with OIDC SSO",
    );
  });

  it("3. Go to admin settings and disable OIDC", function() {
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
    cy.get(enterpriseSettings.oidcButton)
      .should("be.visible")
      .should("contain", "EDIT");
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
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating sso with oidc is disabled
    cy.get(enterpriseSettings.loginWithOIDC).should("not.exist");
  });
});
