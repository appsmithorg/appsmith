import adminsSettings from "../../../../locators/AdminsSettings";

const {
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_MAPS_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
} = require("../../../../../src/constants/ThirdPartyConstants");

describe("Admin settings page", function() {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
  });

  // it("should test that settings page is accessible to super user", () => {
  //   cy.LogOut();
  //   cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
  //   cy.visit("/applications");
  //   cy.get(".t--profile-menu-icon").should("be.visible");
  //   cy.get(".t--profile-menu-icon").click();
  //   cy.get(".t--admin-settings-menu").should("be.visible");
  //   cy.get(".t--admin-settings-menu").click();
  //   cy.url().should("contain", "/settings/general");
  //   cy.wait("@getEnvVariables");
  //   cy.LogOut();
  // });

  // it("should test that settings page is not accessible to normal users", () => {
  //   cy.wait(2000);
  //   cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
  //   cy.visit("/applications");
  //   cy.get(".t--profile-menu-icon").should("be.visible");
  //   cy.get(".t--profile-menu-icon").click();
  //   cy.get(".t--admin-settings-menu").should("not.exist");
  //   cy.visit("/settings/general");
  //   // non super users are redirected to home page
  //   cy.url().should("contain", "/applications");
  //   cy.LogOut();
  // });

  // it("should test that page header is visible", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.appsmithHeader).should("be.visible");
  //   cy.visit("/settings/google-maps");
  //   cy.get(adminsSettings.appsmithHeader).should("be.visible");
  //   cy.visit("/settings/authentication/google-auth");
  //   cy.get(adminsSettings.appsmithHeader).should("be.visible");
  // });

  // it("should test that clicking on logo should redirect to applications page", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.appsmithHeader).should("be.visible");
  //   cy.get(adminsSettings.appsmithLogo).should("be.visible");
  //   cy.get(adminsSettings.appsmithLogo).click();
  //   cy.url().should("contain", "/applications");
  // });

  it("should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait(3000);
    cy.visit("/settings");
    cy.url().should("contain", "/settings/general");
  });

  // it("should test that settings page tab redirects", () => {
  //   cy.visit("/applications");
  //   cy.wait(3000);
  //   cy.get(".t--profile-menu-icon").click();
  //   cy.get(".t--admin-settings-menu").click();
  //   cy.get(adminsSettings.generalTab).click();
  //   cy.url().should("contain", "/settings/general");
  //   cy.get(adminsSettings.advancedTab).click();
  //   cy.url().should("contain", "/settings/advanced");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.emailTab).click();
  //   cy.url().should("contain", "/settings/email");
  //   cy.get(adminsSettings.googleMapsTab).click();
  //   cy.url().should("contain", "/settings/google-maps");
  //   cy.get(adminsSettings.versionTab).click();
  //   cy.url().should("contain", "/settings/version");
  // });

  // it("should test save and clear buttons disabled state", () => {
  //   cy.visit("/settings/general");
  //   const assertVisibilityAndDisabledState = () => {
  //     cy.get(adminsSettings.saveButton).should("be.visible");
  //     cy.get(adminsSettings.saveButton).should("be.disabled");
  //     cy.get(adminsSettings.resetButton).should("be.visible");
  //     cy.get(adminsSettings.resetButton).should("be.disabled");
  //   };
  //   assertVisibilityAndDisabledState();
  //   cy.get(adminsSettings.instanceName).should("be.visible");
  //   cy.get(adminsSettings.instanceName)
  //     .clear()
  //     .type("AppsmithInstance");
  //   cy.get(adminsSettings.saveButton).should("be.visible");
  //   cy.get(adminsSettings.saveButton).should("not.be.disabled");
  //   cy.get(adminsSettings.resetButton).should("be.visible");
  //   cy.get(adminsSettings.resetButton).should("not.be.disabled");
  //   cy.get(adminsSettings.resetButton).click();
  //   assertVisibilityAndDisabledState();
  // });

  // it("should test saving a setting value", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.restartNotice).should("not.exist");
  //   cy.get(adminsSettings.instanceName).should("be.visible");
  //   let instanceName;
  //   cy.generateUUID().then((uuid) => {
  //     instanceName = uuid;
  //     cy.get(adminsSettings.instanceName)
  //       .clear()
  //       .type(uuid);
  //   });
  //   cy.get(adminsSettings.saveButton).should("be.visible");
  //   cy.get(adminsSettings.saveButton).should("not.be.disabled");
  //   cy.intercept("POST", "/api/v1/admin/restart", {
  //     body: { responseMeta: { status: 200, success: true }, data: true },
  //   });
  //   cy.get(adminsSettings.saveButton).click();
  //   cy.wait("@postEnvVariables").then((interception) => {
  //     expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
  //       instanceName,
  //     );
  //   });
  //   cy.get(adminsSettings.restartNotice).should("be.visible");
  //   cy.wait(3000);
  //   cy.get(adminsSettings.restartNotice).should("not.exist");
  //   cy.wait(3000);
  // });

  // it("should test saving settings value from different tabs", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.restartNotice).should("not.exist");
  //   cy.get(adminsSettings.instanceName).should("be.visible");
  //   let instanceName;
  //   cy.generateUUID().then((uuid) => {
  //     instanceName = uuid;
  //     cy.get(adminsSettings.instanceName)
  //       .clear()
  //       .type(uuid);
  //   });
  //   cy.get(adminsSettings.saveButton).should("be.visible");
  //   cy.get(adminsSettings.saveButton).should("not.be.disabled");
  //   cy.get(adminsSettings.emailTab).click();
  //   cy.get(adminsSettings.saveButton).should("be.visible");
  //   cy.get(adminsSettings.saveButton).should("not.be.disabled");
  //   cy.get(adminsSettings.fromAddress).should("be.visible");
  //   let fromAddress;
  //   cy.generateUUID().then((uuid) => {
  //     fromAddress = uuid;
  //     cy.get(adminsSettings.fromAddress)
  //       .clear()
  //       .type(`${uuid}@appsmith.com`);
  //   });
  //   cy.intercept("POST", "/api/v1/admin/restart", {
  //     body: { responseMeta: { status: 200, success: true }, data: true },
  //   });
  //   cy.get(adminsSettings.saveButton).click();
  //   cy.wait("@postEnvVariables").then((interception) => {
  //     expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
  //       instanceName,
  //     );
  //     expect(interception.request.body.APPSMITH_MAIL_FROM).to.equal(
  //       `${fromAddress}@appsmith.com`,
  //     );
  //   });
  //   cy.get(adminsSettings.restartNotice).should("be.visible");
  //   cy.wait(3000);
  //   cy.get(adminsSettings.restartNotice).should("not.exist");
  //   cy.wait(3000);
  // });

  // it("should test that instance name and admin emails exist on general tab", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.instanceName).should("be.visible");
  //   cy.get(adminsSettings.adminEmails).should("be.visible");
  // })

  // it("should test that configure link redirects to google maps setup doc", () => {
  //   cy.visit("/settings/google-maps");
  //   cy.get(adminsSettings.readMoreLink).within(() => {
  //     cy.get("a")
  //       .should("have.attr", "target", "_blank")
  //       .invoke("removeAttr", "target")
  //       .click();
  //     cy.url().should("contain", GOOGLE_MAPS_SETUP_DOC);
  //   });
  // });

  // it("should test that authentication page redirects", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.googleButton).click();
  //   cy.url().should("contain", "/settings/authentication/google-auth");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.githubButton).click();
  //   cy.url().should("contain", "/settings/authentication/github-auth");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.formloginButton).click();
  //   cy.url().should("contain", "/settings/authentication/form-login");
  // });

  // it("should test that configure link redirects to google signup setup doc", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.googleButton).click();
  //   cy.url().should("contain", "/settings/authentication/google-auth");
  //   cy.get(adminsSettings.readMoreLink).within(() => {
  //     cy.get("a")
  //       .should("have.attr", "target", "_blank")
  //       .invoke("removeAttr", "target")
  //       .click();
  //     cy.url().should("contain", GOOGLE_SIGNUP_SETUP_DOC);
  //   });
  // });

  // it("should test that configure link redirects to github signup setup doc", () => {
  //   cy.visit("/settings/general");
  //   cy.get(adminsSettings.authenticationTab).click();
  //   cy.url().should("contain", "/settings/authentication");
  //   cy.get(adminsSettings.githubButton).click();
  //   cy.url().should("contain", "/settings/authentication/github-auth");
  //   cy.get(adminsSettings.readMoreLink).within(() => {
  //     cy.get("a")
  //       .should("have.attr", "target", "_blank")
  //       .invoke("removeAttr", "target")
  //       .click();
  //     cy.url().should("contain", GITHUB_SIGNUP_SETUP_DOC);
  //   });
  // });

  it("should test that read more on version opens up release notes", () => {
    cy.visit("/settings/general");
    cy.get(adminsSettings.versionTab).click();
    cy.url().should("contain", "/settings/version");
    cy.get(adminsSettings.readMoreLink).within(() => {
      cy.get("a").click();
    });
    cy.wait(2000);
    cy.get(".bp3-dialog-container").should("be.visible");
    cy.get(".bp3-dialog-header .bp3-heading").should("be.visible");
    cy.get(".bp3-dialog-header .bp3-heading").should(
      "contain",
      "Product Updates",
    );
    cy.get(".bp3-dialog-close-button").should("be.visible");
    cy.get("[data-cy='t--product-updates-close-btn']").should("be.visible");
    cy.get("[data-cy='t--product-updates-ok-btn']").should("be.visible");
    cy.get(".bp3-dialog-close-button").click();
    cy.wait(2000);
    cy.get(".bp3-dialog-container").should("not.exist");
  });
});
