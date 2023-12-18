import adminsSettings from "../../../../locators/AdminsSettings";
import { agHelper } from "../../../../support/Objects/ObjectsCore";

const {
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
} = require("../../../../../src/constants/ThirdPartyConstants");

describe("Admin settings page", { tags: ["@tag.Settings"] }, function () {
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

  it("1. Should test that settings page is accessible to super user", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    cy.wait("@getEnvVariables");
    cy.LogOut();
  });

  it("2. Should test that settings page is not accessible to normal users", () => {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME3"), Cypress.env("TESTPASSWORD3"));
    cy.get(".admin-settings-menu-option").should("not.exist");
    cy.visit("/settings/general", { timeout: 60000 });
    // non super users are redirected to home page
    cy.url().should("contain", "/applications");
    cy.LogOut(false);
  });

  it("3. Should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings", { timeout: 60000 });
    cy.url().should("contain", "/settings/general");
    cy.wait("@getEnvVariables");
  });

  it(
    "excludeForAirgap",
    "4. Should test that settings page tab redirects",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      agHelper.VisitNAssert("/applications", "getReleaseItems");
      cy.get(".admin-settings-menu-option").click();
      cy.wait("@getEnvVariables");
      cy.get(adminsSettings.generalTab).click();
      cy.url().should("contain", "/settings/general");
      cy.get(adminsSettings.advancedTab).click();
      cy.url().should("contain", "/settings/advanced");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.emailTab).click();
      cy.url().should("contain", "/settings/email");
      cy.get(adminsSettings.developerSettingsTab).click();
      cy.url().should("contain", "/settings/developer-settings");
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", "/settings/version");
    },
  );

  it(
    "airgap",
    "4. Should test that settings page tab redirects and developer settings doesn't exist - airgap",
    { tags: ["@tag.airgap"] },
    () => {
      cy.visit("/applications", { timeout: 60000 });
      if (!Cypress.env("AIRGAPPED")) cy.wait("@getReleaseItems");

      cy.get(".admin-settings-menu-option").click();
      cy.wait("@getEnvVariables");
      cy.get(adminsSettings.generalTab).click();
      cy.url().should("contain", "/settings/general");
      cy.get(adminsSettings.advancedTab).click();
      cy.url().should("contain", "/settings/advanced");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.emailTab).click();
      cy.url().should("contain", "/settings/email");
      cy.get(adminsSettings.developerSettingsTab).should("not.exist");
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", "/settings/version");
    },
  );

  it(
    "excludeForAirgap",
    "5. Should test that authentication page redirects",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.googleButton).click();
      cy.url().should("contain", "/settings/authentication/google-auth");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.githubButton).click();
      cy.url().should("contain", "/settings/authentication/github-auth");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.formloginButton).click();
      cy.url().should("contain", "/settings/authentication/form-login");
    },
  );

  it(
    "airgap",
    "5. Should test that authentication page redirects and google and github auth doesn't exist - airgap",
    { tags: ["@tag.airgap"] },
    () => {
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.googleButton).should("not.exist");
      cy.get(adminsSettings.githubButton).should("not.exist");
      cy.get(adminsSettings.formloginButton).click();
      cy.url().should("contain", "/settings/authentication/form-login");
    },
  );

  it(
    "excludeForAirgap",
    "6. Should test that configure link redirects to google signup setup doc",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.googleButton).click();
      cy.url().should("contain", "/settings/authentication/google-auth");
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click();
        cy.url().should("contain", GOOGLE_SIGNUP_SETUP_DOC);
      });
    },
  );

  it(
    "excludeForAirgap",
    "7. Should test that configure link redirects to github signup setup doc",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", "/settings/authentication");
      cy.get(adminsSettings.githubButton).click();
      cy.url().should("contain", "/settings/authentication/github-auth");
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click();
        cy.url().should("contain", GITHUB_SIGNUP_SETUP_DOC);
      });
    },
  );

  it("8. Should test save and clear buttons disabled state", () => {
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");
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

  it("9. Should test saving a setting value", () => {
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");

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
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy.contains("General", { timeout: 180000 }).should("be.visible"),
    );
  });

  it("10.Should test saving settings value from different tabs", () => {
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");
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
    cy.get(adminsSettings.restartNotice).should("be.visible");
    cy.get(adminsSettings.restartNotice).should("not.exist");
  });
});
