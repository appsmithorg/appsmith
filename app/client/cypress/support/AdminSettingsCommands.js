/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const googleForm = require("../locators/GoogleForm.json");
const googleData = require("../fixtures/googleSource.json");
const githubForm = require("../locators/GithubForm.json");
const adminSettings = require("../locators/AdminsSettings");

Cypress.Commands.add("fillGoogleFormPartly", () => {
  cy.get(googleForm.googleClientId).type(
    Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"),
  );
  cy.get(googleForm.googleAllowedDomains).type(googleData.googleAllowedDomains);
  cy.get(googleForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGoogleForm", () => {
  cy.get(googleForm.googleClientId).type(
    Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"),
  );
  cy.get(googleForm.googleClientSecret).type(
    Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET"),
  );
  cy.get(googleForm.googleAllowedDomains).type(googleData.googleAllowedDomains);
  cy.get(googleForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGithubFormPartly", () => {
  cy.get(githubForm.githubClientId).type(
    Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_ID"),
  );
  cy.get(githubForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGithubForm", () => {
  cy.get(githubForm.githubClientId).type(
    Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_ID"),
  );
  cy.get(githubForm.githubClientSecret).type(
    Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET"),
  );
  cy.get(githubForm.saveBtn).click({ force: true });
});

// open authentication page
Cypress.Commands.add("openAuthentication", () => {
  cy.get(".t--profile-menu-icon").should("be.visible");
  cy.get(".t--profile-menu-icon").click();
  cy.get(".t--admin-settings-menu").should("be.visible");
  cy.get(".t--admin-settings-menu").click();
  cy.url().should("contain", "/settings/general");
  // click authentication tab
  cy.get(adminSettings.authenticationTab).click();
  cy.url().should("contain", "/settings/authentication");
});
