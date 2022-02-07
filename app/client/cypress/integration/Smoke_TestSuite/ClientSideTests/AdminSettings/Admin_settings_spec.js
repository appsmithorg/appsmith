const AdminsSettingsLocators = require("../../../../locators/AdminsSettingsLocators.json");

describe("Admin settings page", function() {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
  });

  it("should test that settings page is accessible to super user", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("be.visible");
    cy.get(".t--admin-settings-menu").click();
    cy.url().should("contain", "/settings/general");
    cy.wait("@getEnvVariables");
    cy.LogOut();
  });

  it("should test that settings page is not accessible to normal users", () => {
    cy.wait(2000);
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.visit("/applications");
    cy.get(".t--profile-menu-icon").should("be.visible");
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").should("not.exist");
    cy.visit("/settings/general");
    // non super users are redirected to home page
    cy.url().should("contain", "/applications");
    cy.LogOut();
  });

  it("should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait(3000);
    cy.visit("/settings");
    cy.url().should("contain", "/settings/general");
  });

  it("should test that settings page tab redirects", () => {
    cy.visit("/applications");
    cy.wait(3000);
    cy.get(".t--profile-menu-icon").click();
    cy.get(".t--admin-settings-menu").click();
    cy.get(AdminsSettingsLocators.generalTab).click();
    cy.url().should("contain", "/settings/general");
    cy.get(AdminsSettingsLocators.advancedTab).click();
    cy.url().should("contain", "/settings/advanced");
    cy.get(AdminsSettingsLocators.authenticationTab).click();
    cy.url().should("contain", "/settings/authentication");
    cy.get(AdminsSettingsLocators.emailTab).click();
    cy.url().should("contain", "/settings/email");
    cy.get(AdminsSettingsLocators.googleMapsTab).click();
    cy.url().should("contain", "/settings/google-maps");
    cy.get(AdminsSettingsLocators.versionTab).click();
    cy.url().should("contain", "/settings/version");
  });

  it("should test that setting page back button redirects to home page", () => {
    cy.get(AdminsSettingsLocators.backButton).should("be.visible");
    cy.get(AdminsSettingsLocators.backButton).click();
    cy.url().should("contain", "/applications");
  });

  it("should test save and clear buttons disabled state", () => {
    cy.visit("/settings/general");
    const assertVisibilityAndDisabledState = () => {
      cy.get(AdminsSettingsLocators.saveButton).should("be.visible");
      cy.get(AdminsSettingsLocators.saveButton).should("be.disabled");
      cy.get(AdminsSettingsLocators.resetButton).should("be.visible");
      cy.get(AdminsSettingsLocators.resetButton).should("be.disabled");
    };
    assertVisibilityAndDisabledState();
    cy.get(AdminsSettingsLocators.instanceName).should("be.visible");
    cy.get(AdminsSettingsLocators.instanceName)
      .clear()
      .type("AppsmithInstance");
    cy.get(AdminsSettingsLocators.saveButton).should("be.visible");
    cy.get(AdminsSettingsLocators.saveButton).should("not.be.disabled");
    cy.get(AdminsSettingsLocators.resetButton).should("be.visible");
    cy.get(AdminsSettingsLocators.resetButton).should("not.be.disabled");
    cy.get(AdminsSettingsLocators.resetButton).click();
    assertVisibilityAndDisabledState();
  });

  it("should test saving a setting value", () => {
    cy.visit("/settings/general");
    cy.get(AdminsSettingsLocators.restartNotice).should("not.exist");
    cy.get(AdminsSettingsLocators.instanceName).should("be.visible");
    let instanceName;
    cy.generateUUID().then((uuid) => {
      instanceName = uuid;
      cy.get(AdminsSettingsLocators.instanceName)
        .clear()
        .type(uuid);
    });
    cy.get(AdminsSettingsLocators.saveButton).should("be.visible");
    cy.get(AdminsSettingsLocators.saveButton).should("not.be.disabled");
    cy.intercept("POST", "/api/v1/admin/restart", {
      body: { responseMeta: { status: 200, success: true }, data: true },
    });
    cy.get(AdminsSettingsLocators.saveButton).click();
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
        instanceName,
      );
    });
    cy.get(AdminsSettingsLocators.restartNotice).should("be.visible");
    cy.wait(3000);
    cy.get(AdminsSettingsLocators.restartNotice).should("not.exist");
    cy.wait(3000);
  });

  it("should test saving settings value from different tabs", () => {
    cy.visit("/settings/general");
    cy.get(AdminsSettingsLocators.restartNotice).should("not.exist");
    cy.get(AdminsSettingsLocators.instanceName).should("be.visible");
    let instanceName;
    cy.generateUUID().then((uuid) => {
      instanceName = uuid;
      cy.get(AdminsSettingsLocators.instanceName)
        .clear()
        .type(uuid);
    });
    cy.get(AdminsSettingsLocators.saveButton).should("be.visible");
    cy.get(AdminsSettingsLocators.saveButton).should("not.be.disabled");
    cy.get(AdminsSettingsLocators.emailTab).click();
    cy.get(AdminsSettingsLocators.saveButton).should("be.visible");
    cy.get(AdminsSettingsLocators.saveButton).should("not.be.disabled");
    cy.get(AdminsSettingsLocators.fromAddress).should("be.visible");
    let fromAddress;
    cy.generateUUID().then((uuid) => {
      fromAddress = uuid;
      cy.get(AdminsSettingsLocators.fromAddress)
        .clear()
        .type(`${uuid}@appsmith.com`);
    });
    cy.intercept("POST", "/api/v1/admin/restart", {
      body: { responseMeta: { status: 200, success: true }, data: true },
    });
    cy.get(AdminsSettingsLocators.saveButton).click();
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
        instanceName,
      );
      expect(interception.request.body.APPSMITH_MAIL_FROM).to.equal(
        `${fromAddress}@appsmith.com`,
      );
    });
    cy.get(AdminsSettingsLocators.restartNotice).should("be.visible");
    cy.wait(3000);
    cy.get(AdminsSettingsLocators.restartNotice).should("not.exist");
    cy.wait(3000);
  });
});
