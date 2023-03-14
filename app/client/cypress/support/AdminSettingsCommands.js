/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const googleForm = require("../locators/GoogleForm.json");
const googleData = require("../fixtures/googleSource.json");
const githubForm = require("../locators/GithubForm.json");
const adminSettings = require("../locators/AdminsSettings");

const BASE_URL = Cypress.config().baseUrl;

Cypress.Commands.add("fillGoogleFormPartly", () => {
  cy.get(googleForm.googleClientId).type(
    Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"),
  );
  cy.get(googleForm.googleAllowedDomains).type(googleData.googleAllowedDomains);
  cy.get(googleForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGoogleForm", () => {
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  cy.get(googleForm.googleJSOriginUrl).should("have.value", `${baseUrl}`);
  cy.get(googleForm.googleRedirectUrl).should(
    "have.value",
    `${baseUrl}/login/oauth2/code/google`,
  );
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
  cy.get(".admin-settings-menu-option").should("be.visible");
  cy.get(".admin-settings-menu-option").click();
  cy.url().should("contain", "/settings/general");
  // click authentication tab
  cy.get(adminSettings.authenticationTab).click();
  cy.url().should("contain", "/settings/authentication");
});

Cypress.Commands.add("waitForServerRestart", () => {
  cy.get(adminSettings.restartNotice).should("be.visible");
  // Wait for restart notice to not be visible with a timeout
  // Cannot use cy.get as mentioned in https://github.com/NoriSte/cypress-wait-until/issues/75#issuecomment-572685623
  cy.waitUntil(() => !Cypress.$(adminSettings.restartNotice).length, {
    timeout: 120000,
  });
  cy.get(adminSettings.saveButton).should("be.visible");
});
