import adminSettings from "../../../../locators/AdminsSettings";
import homePage from "../../../../locators/HomePage";

describe("Form Login test functionality", function () {
  it(
    "1. Go to admin settings and disable Form Signup",
    { tags: ["@tag.Settings"] },
    function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.openAuthentication();
      cy.get(adminSettings.formloginButton)
        .should("be.visible")
        .should("contain", "Edit");
      cy.get(adminSettings.formloginButton).click();
      cy.wait(2000);
      // disable form signup
      cy.get(adminSettings.formSignupDisabled).should("have.value", "on");
      cy.get(adminSettings.formSignupDisabled).click({ force: true });
      cy.wait(2000);
      // assert server is restarting
      cy.get(adminSettings.saveButton).should("be.visible");
      cy.get(adminSettings.saveButton).should("not.be.disabled");
      cy.get(adminSettings.saveButton).click();
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
        cy.get(".ads-v2-callout__children").should(
          "contain",
          "Signup is restricted on this instance of Appsmith",
        );
        // restore setting
        cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
        cy.get(".admin-settings-menu-option").click();
        cy.get(adminSettings.authenticationTab).click();
        cy.get(adminSettings.formloginButton).click();
        cy.wait(2000);
        cy.get(adminSettings.formSignupDisabled).click({ force: true });
        cy.wait(2000);
        cy.get(adminSettings.saveButton).click();
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
        cy.get(".ads-v2-callout__children").should("not.exist");
      });
    },
  );

  it(
    "2. Go to admin settings and disable Form Login",
    { tags: ["@tag.excludeForAirgap"] },
    function () {
      cy.LogOut(false);
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.openAuthentication();
      cy.get(adminSettings.formloginButton)
        .should("be.visible")
        .should("contain", "Edit");

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
      cy.get(adminSettings.formLoginEnabled).should("have.value", "on");
      cy.get(adminSettings.formLoginEnabled).click({ force: true });
      cy.wait(2000);
      // assert server is restarting
      cy.get(adminSettings.saveButton).should("be.visible");
      cy.get(adminSettings.saveButton).should("not.be.disabled");
      cy.get(adminSettings.saveButton).click();
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
      cy.openAuthentication();

      // enable form login
      cy.get(adminSettings.formloginButton)
        .should("be.visible")
        .should("contain", "Enable");
      cy.get(adminSettings.formloginButton).click();
      cy.get(adminSettings.formLoginEnabled).click({ force: true });
      cy.wait(2000);
      // assert server is restarting
      cy.get(adminSettings.saveButton).should("be.visible");
      cy.get(adminSettings.saveButton).should("not.be.disabled");
      cy.get(adminSettings.saveButton).click();
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
    },
  );
});
