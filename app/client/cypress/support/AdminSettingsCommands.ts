/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import "cy-verify-downloads";
import "cypress-file-upload";
import googleForm from "../locators/GoogleForm.json";
import googleData from "../fixtures/googleSource.json";
import githubForm from "../locators/GithubForm.json";
import adminSettings from "../locators/AdminsSettings";
import { ObjectsRegistry } from "./Objects/Registry";

const BASE_URL: string = Cypress.config().baseUrl || "";

const agHelper = ObjectsRegistry.AggregateHelper;
const adminSettingsHelper = ObjectsRegistry.AdminSettings;

Cypress.Commands.add("fillGoogleFormPartly", () => {
  cy.get(googleForm.googleClientId).type(Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID") as string);
  cy.get(googleForm.googleAllowedDomains).type(googleData.googleAllowedDomains as string);
  cy.get(googleForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGoogleForm", () => {
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  cy.get(googleForm.googleJSOriginUrl).should("have.value", `${baseUrl}`);
  cy.get(googleForm.googleRedirectUrl).should("have.value", `${baseUrl}/login/oauth2/code/google`);
  cy.get(googleForm.googleClientId).type(Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID") as string);
  cy.get(googleForm.googleClientSecret).type(Cypress.env("APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET") as string);
  cy.get(googleForm.googleAllowedDomains).type(googleData.googleAllowedDomains as string);
  cy.get(googleForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGithubFormPartly", () => {
  cy.get(githubForm.githubClientId).type(Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_ID") as string);
  cy.get(githubForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillGithubForm", () => {
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  cy.get(githubForm.githubHomepageUrl).should("have.value", `${baseUrl}`);
  cy.get(githubForm.githubCallbackUrl).should("have.value", `${baseUrl}/login/oauth2/code/github`);
  cy.get(githubForm.githubClientId).type(Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_ID") as string);
  cy.get(githubForm.githubClientSecret).type(Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET") as string);
  cy.get(githubForm.saveBtn).click({ force: true });
});

Cypress.Commands.add("openAuthentication", () => {
  cy.get(".admin-settings-menu-option").should("be.visible");
  cy.get(".admin-settings-menu-option").click();
  cy.url().should("contain", adminSettingsHelper.routes.GENERAL);
  cy.get(adminSettings.authenticationTab).click();
  cy.url().should("contain", adminSettingsHelper.routes.AUTHENTICATION);
});

Cypress.Commands.add("waitForServerRestart", () => {
  cy.get(adminSettings.restartNotice).should("be.visible");
  cy.get(adminSettings.restartNotice, { timeout: 300000 }).should("not.exist");
  cy.get(adminSettings.appsmithStarting, { timeout: 300000 }).should("not.exist");

  cy.window().then((win) => {
    (win as any).location.reload();
  });

  agHelper.AssertElementVisibility(adminSettings.saveButton, true, 0, 30000);
  agHelper.AssertElementAbsence(adminSettings.restartNotice, 30000);
});