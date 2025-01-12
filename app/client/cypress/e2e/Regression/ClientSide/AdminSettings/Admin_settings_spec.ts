import adminsSettings from "../../../../locators/AdminsSettings";
import {
  agHelper,
  adminSettings as adminSettingsHelper,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

const {
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
    agHelper.GetNClick(adminSettingsHelper._adminSettingsBtn);
    agHelper.AssertURL(adminSettingsHelper.routes.GENERAL);
    cy.wait("@getEnvVariables");
    cy.LogOut();
  });

  it("2. Should test that settings page is not accessible to normal users", () => {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME3"), Cypress.env("TESTPASSWORD3"));
    agHelper.AssertElementAbsence(adminSettingsHelper._adminSettingsBtn);
    agHelper.VisitNAssert(adminSettingsHelper.routes.GENERAL);
    // non super users are redirected to home page
    agHelper.AssertURL("/applications");
    cy.LogOut(false);
  });

  it("3. Should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings", { timeout: 60000 });
    agHelper.AssertURL(adminSettingsHelper.routes.GENERAL);
    cy.wait("@getEnvVariables");
  });

  it(
    "airgap",
    "4. Should test that settings page tab redirects and developer settings doesn't exist - airgap",
    { tags: ["@tag.airgap"] },
    () => {
      cy.visit("/applications", { timeout: 60000 });
      if (!Cypress.env("AIRGAPPED")) cy.wait("@getAllWorkspaces");

      agHelper.GetNClick(adminSettingsHelper._adminSettingsBtn);
      cy.wait("@getEnvVariables");
      agHelper.GetNClick(adminsSettings.generalTab);
      agHelper.AssertURL(adminSettingsHelper.routes.GENERAL);
      agHelper.GetNClick(adminsSettings.advancedTab);
      agHelper.AssertURL(adminSettingsHelper.routes.ADVANCED);
      agHelper.GetNClick(adminsSettings.authenticationTab);
      agHelper.AssertURL(adminSettingsHelper.routes.AUTHENTICATION);
      agHelper.GetNClick(adminsSettings.emailTab);
      agHelper.AssertURL(adminSettingsHelper.routes.EMAIL);
      agHelper.AssertElementAbsence(adminsSettings.developerSettingsTab);
      agHelper.GetNClick(adminsSettings.versionTab);
      agHelper.AssertURL(adminSettingsHelper.routes.VERSION);
    },
  );

  it(
    "airgap",
    "5. Should test that authentication page redirects and google and github auth doesn't exist - airgap",
    { tags: ["@tag.airgap"] },
    () => {
      agHelper.VisitNAssert(
        adminSettingsHelper.routes.GENERAL,
        "getEnvVariables",
      );
      agHelper.GetNClick(adminsSettings.authenticationTab);
      agHelper.AssertURL(adminSettingsHelper.routes.AUTHENTICATION);
      agHelper.AssertElementAbsence(adminsSettings.googleButton);
      agHelper.AssertElementAbsence(adminsSettings.githubButton);
      agHelper.GetNClick(adminsSettings.formloginButton);
      agHelper.AssertURL(adminSettingsHelper.routes.FORMLOGIN);
    },
  );

  it(
    "6. Should test that configure link redirects to google signup setup doc",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      agHelper.VisitNAssert(
        adminSettingsHelper.routes.GENERAL,
        "getEnvVariables",
      );
      agHelper.GetNClick(adminsSettings.authenticationTab);
      agHelper.AssertURL(adminSettingsHelper.routes.AUTHENTICATION);
      agHelper.GetNClick(adminsSettings.googleButton);
      agHelper.AssertURL(adminSettingsHelper.routes.GOOGLEAUTH);
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click();
        agHelper.AssertURL(GOOGLE_SIGNUP_SETUP_DOC);
      });
    },
  );

  it("7. Should test save and clear buttons disabled state", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );
    const assertVisibilityAndDisabledState = () => {
      agHelper.AssertElementVisibility(adminsSettings.saveButton);
      cy.get(adminsSettings.saveButton).should("be.disabled");
      agHelper.AssertElementVisibility(adminsSettings.resetButton);
      cy.get(adminsSettings.resetButton).should("be.disabled");
    };
    assertVisibilityAndDisabledState();
    agHelper.AssertElementVisibility(adminsSettings.instanceName);
    cy.get(adminsSettings.instanceName).clear().type("AppsmithInstance");
    agHelper.AssertElementVisibility(adminsSettings.saveButton);
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    agHelper.AssertElementVisibility(adminsSettings.resetButton);
    cy.get(adminsSettings.resetButton).should("not.be.disabled");
    agHelper.GetNClick(adminsSettings.resetButton);
    assertVisibilityAndDisabledState();
  });

  it("8. Should test saving a setting value", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );

    agHelper.AssertElementAbsence(adminsSettings.restartNotice);
    agHelper.AssertElementVisibility(adminsSettings.instanceName);
    let instanceName: string;
    cy.generateUUID().then((uuid: string) => {
      instanceName = uuid;
      cy.get(adminsSettings.instanceName).clear().type(uuid);
    });
    agHelper.AssertElementVisibility(adminsSettings.saveButton);
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    agHelper.GetNClick(adminsSettings.saveButton);
    cy.wait("@postTenantConfig").then((interception) => {
      expect(interception.request.body.instanceName).to.equal(instanceName);
    });
    // adding wait for server to restart
    cy.waitUntil(() =>
      cy.contains("General", { timeout: 180000 }).should("be.visible"),
    );
  });

  it("9.Should test saving settings value from different tabs", () => {
    agHelper.VisitNAssert(
      adminSettingsHelper.routes.GENERAL,
      "getEnvVariables",
    );
    agHelper.AssertElementAbsence(adminsSettings.restartNotice);
    agHelper.AssertElementVisibility(adminsSettings.instanceName);
    let instanceName: string;
    cy.generateUUID().then((uuid: string) => {
      instanceName = uuid;
      cy.get(adminsSettings.instanceName).clear().type(uuid);
    });
    agHelper.AssertElementVisibility(adminsSettings.saveButton);
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    agHelper.GetNClick(adminsSettings.emailTab);
    agHelper.AssertElementVisibility(adminsSettings.saveButton);
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    agHelper.AssertElementVisibility(adminsSettings.fromAddress);
    let fromAddress: string;
    cy.generateUUID().then((uuid: string) => {
      fromAddress = uuid;
      cy.get(adminsSettings.fromAddress).clear().type(`${uuid}@appsmith.com`);
    });
    cy.intercept("POST", "/api/v1/admin/restart", {
      body: { responseMeta: { status: 200, success: true }, data: true },
    });
    agHelper.GetNClick(adminsSettings.saveButton);
    cy.wait("@postTenantConfig").then((interception) => {
      expect(interception.request.body.instanceName).to.equal(instanceName);
    });
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_MAIL_FROM).to.equal(
        `${fromAddress}@appsmith.com`,
      );
    });
    agHelper.AssertElementVisibility(adminsSettings.restartNotice);
  });

  it("10. Verify default instance name", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.GetNClick(adminSettingsHelper._adminSettingsBtn);
    agHelper.AssertURL(adminSettingsHelper.routes.GENERAL);
    cy.wait("@getEnvVariables");
    agHelper
      .GetText(adminSettingsHelper._instanceName, "val")
      .then(($text) => expect($text).to.eq("Appsmith"));
  });

  it(
    "11. Verify all admin setting sections are accessible",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      homePage.LogOutviaAPI();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      agHelper.GetNClick(adminSettingsHelper._adminSettingsBtn);
      cy.wait("@getEnvVariables");
      agHelper.GetNClick(adminsSettings.generalTab);
      agHelper.AssertURL(adminSettingsHelper.routes.GENERAL);
      agHelper.GetNClick(adminsSettings.advancedTab);
      agHelper.AssertURL(adminSettingsHelper.routes.ADVANCED);
      agHelper.GetNClick(adminsSettings.authenticationTab);
      agHelper.AssertURL(adminSettingsHelper.routes.AUTHENTICATION);
      agHelper.GetNClick(adminsSettings.emailTab);
      agHelper.AssertURL(adminSettingsHelper.routes.EMAIL);
      agHelper.GetNClick(adminsSettings.developerSettingsTab);
      agHelper.AssertURL(adminSettingsHelper.routes.DEVELOPER_SETTINGS);
      agHelper.GetNClick(adminsSettings.versionTab);
      agHelper.AssertURL(adminSettingsHelper.routes.VERSION);
      agHelper.GetNClick(adminsSettings.branding);
      agHelper.AssertURL(adminSettingsHelper.routes.BRANDING);
      agHelper.GetNClick(adminsSettings.provisioning);
      agHelper.AssertURL(adminSettingsHelper.routes.PROVISIONING);
      agHelper.GetNClick(adminsSettings.accessControl);
      agHelper.AssertURL(adminSettingsHelper.routes.ACCESS_CONTROL);
      agHelper.GetNClick(adminsSettings.auditLogs);
      agHelper.AssertURL(adminSettingsHelper.routes.AUDIT_LOGS);
    },
  );
});
