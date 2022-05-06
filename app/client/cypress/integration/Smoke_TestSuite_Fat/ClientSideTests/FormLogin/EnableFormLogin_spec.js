const adminSettings = require("../../../../locators/AdminsSettings");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";

describe("Form Login test functionality", function() {
  it("1. Go to admin settings and disable Form Signup", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.openAuthentication();
    cy.get(adminSettings.formloginButton)
      .should("be.visible")
      .should("contain", "EDIT");
    cy.get(adminSettings.formloginButton).click();
    cy.wait(2000);
    // disable form signup
    cy.get(adminSettings.formSignupDisabled)
      .get("input")
      .should("have.value", "true");
    cy.get(adminSettings.formSignupDisabled).click({ force: true });
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.saveButton).should("be.visible");
    cy.get(adminSettings.saveButton).should("not.be.disabled");
    cy.get(adminSettings.saveButton).click();
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    // validating form signup is disabled
    cy.get(".t--sign-up").click({ force: true });
    cy.generateUUID().then((uid) => {
      cy.get("[type='email']").type(uid + "@appsmith.com");
      cy.get("[type='password']").type(uid);
      cy.get("[type='submit']").click({ force: true });
      cy.get(".form-message-container").should(
        "contain",
        "Signup is restricted on this instance of Appsmith",
      );
      // restore setting
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.visit("/applications");
      cy.get(".t--profile-menu-icon").click();
      cy.get(".t--admin-settings-menu").click();
      cy.get(adminSettings.authenticationTab).click();
      cy.get(adminSettings.formloginButton).click();
      cy.wait(2000);
      cy.get(adminSettings.formSignupDisabled).click({ force: true });
      cy.wait(2000);
      cy.get(adminSettings.saveButton).click();
      cy.get(adminSettings.restartNotice).should("be.visible");
      cy.wait(120000);
      cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
      cy.get(homePage.profileMenu).click();
      cy.get(homePage.signOutIcon).click();
    });
    cy.wait(500);
    // validating form signup is disabled
    cy.get(".t--sign-up").click({ force: true });
    cy.generateUUID().then((uid) => {
      cy.get("[type='email']").type(uid + "@appsmith.com");
      cy.get("[type='password']").type(uid);
      cy.get("[type='submit']").click({ force: true });
      cy.get(".form-message-container").should("not.exist");
    });
  });

  it("2. Go to admin settings and disable Form Login", function() {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.openAuthentication();
    cy.get(adminSettings.formloginButton)
      .should("be.visible")
      .should("contain", "EDIT");

    // enable github login
    cy.get(adminSettings.githubButton).click();
    cy.wait(2000);
    // fill github form
    cy.fillGithubForm();
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.wait(5000);
    cy.reload();
    cy.get(adminSettings.authenticationTab).click();
    cy.get(adminSettings.formloginButton).click();
    cy.wait(2000);
    // disable form signup
    cy.get(adminSettings.formLoginDisabled)
      .get("input")
      .should("have.value", "true");
    cy.get(adminSettings.formLoginDisabled).click({ force: true });
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.saveButton).should("be.visible");
    cy.get(adminSettings.saveButton).should("not.be.disabled");
    cy.get(adminSettings.saveButton).click();
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    cy.reload();
    cy.wait(5000);
    // validating form signup is disabled
    cy.get("form").should("not.exist");
    cy.get(".t--sign-up").should("not.exist");
    // cy.wait(30000); // restart nginx docker
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.openAuthentication();

    // enable form login
    cy.get(adminSettings.formloginButton)
      .should("be.visible")
      .should("contain", "ENABLE");
    cy.get(adminSettings.formloginButton).click();
    cy.get(adminSettings.formLoginDisabled).click({ force: true });
    cy.wait(2000);
    // assert server is restarting
    cy.get(adminSettings.saveButton).should("be.visible");
    cy.get(adminSettings.saveButton).should("not.be.disabled");
    cy.get(adminSettings.saveButton).click();
    cy.get(adminSettings.restartNotice).should("be.visible");
    // adding wait for server to restart
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.reload();

    // disable github
    cy.get(adminSettings.authenticationTab).click();
    cy.get(adminSettings.githubButton).click();
    cy.wait(2000);
    cy.get(adminSettings.disconnectBtn)
      .click()
      .should("contain", "Are you sure?");
    cy.get(adminSettings.disconnectBtn).click();
    cy.wait(120000);
    cy.waitUntil(() => cy.get(homePage.profileMenu).should("be.visible"));
    cy.reload();
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    cy.get(adminSettings.loginWithGithub).should("not.exist");
    cy.get("form").should("exist");
    cy.get(".t--sign-up").should("exist");
  });
});
