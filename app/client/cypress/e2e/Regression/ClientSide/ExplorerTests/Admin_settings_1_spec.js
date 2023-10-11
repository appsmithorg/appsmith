/// <reference types="cypress-tags" />
import adminsSettings from "../../../../locators/AdminsSettings";

const {
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_MAPS_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
} = require("../../../../../src/constants/ThirdPartyConstants");

const routes = {
  APPLICATIONS: "/applications",
  SETTINGS: "/settings",
  GENERAL: "/settings/general",
  EMAIL: "/settings/email",
  DEVELOPER_SETTINGS: "/settings/developer-settings",
  AUTHENTICATION: "/settings/authentication",
  GOOGLEAUTH: "/settings/authentication/google-auth",
  GITHUBAUTH: "/settings/authentication/github-auth",
  FORMLOGIN: "/settings/authentication/form-login",
  ADVANCED: "/settings/advanced",
  VERSION: "/settings/version",
};

describe("Admin settings page", function () {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
    cy.intercept("PUT", "/api/v1/tenants", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postTenantConfig");
  });

  it("1. should test that settings page is accessible to super user", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", routes.GENERAL);
    cy.wait("@getEnvVariables");
  });

  it("2. should test that page header is visible", () => {
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
    cy.visit(routes.DEVELOPER_SETTINGS, { timeout: 60000 });
    cy.url().should("contain", "/developer-settings");
    cy.wait(2000); //page to load properly
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
    cy.visit(routes.GOOGLEAUTH, { timeout: 60000 });
    cy.url().should("contain", "/google-auth");
    cy.wait(2000); //page to load properly
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
  });

  it("3. should test that clicking on logo should redirect to applications page", () => {
    cy.visit(routes.GENERAL, { timeout: 60000 });
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
    cy.get(adminsSettings.appsmithLogo).should("be.visible");
    cy.get(adminsSettings.appsmithLogo).click();
    cy.url().should("contain", routes.APPLICATIONS);
  });

  it("4. should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit(routes.SETTINGS, { timeout: 60000 });
    cy.url().should("contain", routes.GENERAL);
  });

  it(
    "excludeForAirgap",
    "5. should test that settings page tab redirects not airgap",
    () => {
      cy.visit(routes.APPLICATIONS, { timeout: 60000 });
      cy.wait(3000);
      cy.get(".admin-settings-menu-option").click();
      cy.get(adminsSettings.generalTab).click();
      cy.url().should("contain", routes.GENERAL);
      cy.get(adminsSettings.advancedTab).click();
      cy.url().should("contain", routes.ADVANCED);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.emailTab).click();
      cy.url().should("contain", routes.EMAIL);
      cy.get(adminsSettings.developerSettingsTab).click();
      cy.url().should("contain", routes.DEVELOPER_SETTINGS);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
    },
  );

  it(
    "airgap",
    "5. should test that settings page tab redirects and google maps doesn't exist - airgap",
    () => {
      cy.visit(routes.APPLICATIONS, { timeout: 60000 });
      cy.wait(3000);
      cy.get(".admin-settings-menu-option").click();
      cy.get(adminsSettings.generalTab).click();
      cy.url().should("contain", routes.GENERAL);
      cy.get(adminsSettings.advancedTab).click();
      cy.url().should("contain", routes.ADVANCED);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.emailTab).click();
      cy.get(adminsSettings.developerSettingsTab).should("not.exist");
      cy.url().should("contain", routes.EMAIL);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
    },
  );

  it("6. should test save and clear buttons disabled state", () => {
    cy.visit(routes.GENERAL, { timeout: 60000 });
    const assertVisibilityAndDisabledState = () => {
      cy.get(adminsSettings.saveButton).should("be.visible");
      cy.get(adminsSettings.saveButton).should("be.disabled");
      cy.get(adminsSettings.resetButton).should("be.visible");
      cy.get(adminsSettings.resetButton).should("be.disabled");
    };
    assertVisibilityAndDisabledState();
    cy.get(adminsSettings.instanceName).should("be.visible");
    cy.get(adminsSettings.instanceName).clear().type("AppsmithInstance");
    cy.get(adminsSettings.saveButton).should("be.visible");
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    cy.get(adminsSettings.resetButton).should("be.visible");
    cy.get(adminsSettings.resetButton).should("not.be.disabled");
    cy.get(adminsSettings.resetButton).click();
    assertVisibilityAndDisabledState();
  });

  it("7. should test saving a setting value", () => {
    cy.visit(routes.GENERAL, { timeout: 60000 });
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.get(adminsSettings.instanceName).should("be.visible");
    let instanceName;
    cy.generateUUID().then((uuid) => {
      instanceName = uuid;
      cy.get(adminsSettings.instanceName).clear().type(uuid);
    });
    cy.get(adminsSettings.saveButton).should("be.visible");
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    cy.get(adminsSettings.saveButton).click();
    cy.wait("@postTenantConfig").then((interception) => {
      expect(interception.request.body.instanceName).to.equal(instanceName);
    });
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.wait(3000);
  });

  it("8. should test saving settings value from different tabs", () => {
    cy.visit(routes.GENERAL, { timeout: 60000 });
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.get(adminsSettings.instanceName).should("be.visible");
    let instanceName;
    cy.generateUUID().then((uuid) => {
      instanceName = uuid;
      cy.get(adminsSettings.instanceName).clear().type(uuid);
    });
    cy.get(adminsSettings.saveButton).should("be.visible");
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    cy.get(adminsSettings.emailTab).click();
    cy.get(adminsSettings.saveButton).should("be.visible");
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    cy.get(adminsSettings.fromAddress).should("be.visible");
    let fromAddress;
    cy.generateUUID().then((uuid) => {
      fromAddress = uuid;
      cy.get(adminsSettings.fromAddress).clear().type(`${uuid}@appsmith.com`);
    });
    cy.intercept("POST", "/api/v1/admin/restart", {
      body: { responseMeta: { status: 200, success: true }, data: true },
    });
    cy.get(adminsSettings.saveButton).click();
    cy.wait("@postTenantConfig").then((interception) => {
      expect(interception.request.body.instanceName).to.equal(instanceName);
    });
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_MAIL_FROM).to.equal(
        `${fromAddress}@appsmith.com`,
      );
    });
    cy.waitUntil(() =>
      cy.contains("General", { timeout: 180000 }).should("be.visible"),
    );
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.wait(3000);
  });

  it("9. should test that instance name and admin emails exist on general tab", () => {
    cy.visit(routes.GENERAL, { timeout: 60000 });
    cy.get(adminsSettings.instanceName).should("be.visible");
    cy.get(adminsSettings.adminEmails).should("be.visible");
  });
});
