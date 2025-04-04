/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const googleForm = require("../locators/GoogleForm.json");
const googleData = require("../fixtures/googleSource.json");
const githubForm = require("../locators/GithubForm.json");
import adminSettings from "../locators/AdminsSettings";
import { ObjectsRegistry } from "./Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;
let adminSettingsHelper = ObjectsRegistry.AdminSettings;
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
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  cy.get(githubForm.githubHomepageUrl).should("have.value", `${baseUrl}`);
  cy.get(githubForm.githubCallbackUrl).should(
    "have.value",
    `${baseUrl}/login/oauth2/code/github`,
  );
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
  cy.url().should("contain", adminSettingsHelper.routes.PROFILE);
  // click authentication tab
  cy.get(adminSettings.authenticationTab).click();
  cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
});

Cypress.Commands.add("waitForServerRestart", () => {
  cy.get(adminSettings.restartNotice).should("be.visible");
  // Wait for restart notice to not be visible with a timeout
  // Cannot use cy.get as mentioned in https://github.com/NoriSte/cypress-wait-until/issues/75#issuecomment-572685623
  // cy.waitUntil(() => !Cypress.$(adminSettings.restartNotice).length, {
  //   timeout: 180000,
  // });
  cy.get(adminSettings.restartNotice, { timeout: 600000 }).should("not.exist");
  cy.get(adminSettings.appsmithStarting, { timeout: 600000 }).should(
    "not.exist",
  );

  cy.window().then((win) => {
    win.location.reload();
  });
  agHelper.AssertElementVisibility(adminSettings.saveButton, true, 0, 30000);
  agHelper.AssertElementAbsence(adminSettings.restartNotice, 30000);
});
