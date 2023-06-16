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
  GOOGLE_MAPS: "/settings/google-maps",
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
    cy.visit(routes.GOOGLE_MAPS);
    cy.url().should("contain", "/google-maps");
    cy.wait(2000); //page to load properly
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
    cy.visit(routes.GOOGLEAUTH);
    cy.url().should("contain", "/google-auth");
    cy.wait(2000); //page to load properly
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
  });

  it("3. should test that clicking on logo should redirect to applications page", () => {
    cy.visit(routes.GENERAL);
    cy.get(adminsSettings.appsmithHeader).should("be.visible");
    cy.get(adminsSettings.appsmithLogo).should("be.visible");
    cy.get(adminsSettings.appsmithLogo).click();
    cy.url().should("contain", routes.APPLICATIONS);
  });

  it("4. should test that settings page is redirected to default tab", () => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit(routes.SETTINGS);
    cy.url().should("contain", routes.GENERAL);
  });

  it(
    "excludeForAirgap",
    "5. should test that settings page tab redirects not airgap",
    () => {
      cy.visit(routes.APPLICATIONS);
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
      cy.get(adminsSettings.googleMapsTab).click();
      cy.url().should("contain", routes.GOOGLE_MAPS);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
    },
  );

  it(
    "airgap",
    "5. should test that settings page tab redirects and google maps doesn't exist - airgap",
    () => {
      cy.visit(routes.APPLICATIONS);
      cy.wait(3000);
      cy.get(".admin-settings-menu-option").click();
      cy.get(adminsSettings.generalTab).click();
      cy.url().should("contain", routes.GENERAL);
      cy.get(adminsSettings.advancedTab).click();
      cy.url().should("contain", routes.ADVANCED);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.emailTab).click();
      cy.get(adminsSettings.googleMapsTab).should("not.exist");
      cy.url().should("contain", routes.EMAIL);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
    },
  );

  it("6. should test save and clear buttons disabled state", () => {
    cy.visit(routes.GENERAL);
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
    cy.visit(routes.GENERAL);
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.get(adminsSettings.instanceName).should("be.visible");
    let instanceName;
    cy.generateUUID().then((uuid) => {
      instanceName = uuid;
      cy.get(adminsSettings.instanceName).clear().type(uuid);
    });
    cy.get(adminsSettings.saveButton).should("be.visible");
    cy.get(adminsSettings.saveButton).should("not.be.disabled");
    cy.intercept("POST", "/api/v1/admin/restart", {
      body: { responseMeta: { status: 200, success: true }, data: true },
    });
    cy.get(adminsSettings.saveButton).click();
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
        instanceName,
      );
    });
    cy.get(adminsSettings.restartNotice).should("be.visible");
    cy.wait(3000);
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.wait(3000);
  });

  it("8. should test saving settings value from different tabs", () => {
    cy.visit(routes.GENERAL);
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
    cy.wait("@postEnvVariables").then((interception) => {
      expect(interception.request.body.APPSMITH_INSTANCE_NAME).to.equal(
        instanceName,
      );
      expect(interception.request.body.APPSMITH_MAIL_FROM).to.equal(
        `${fromAddress}@appsmith.com`,
      );
    });
    cy.get(adminsSettings.restartNotice).should("be.visible");
    cy.wait(3000);
    cy.get(adminsSettings.restartNotice).should("not.exist");
    cy.wait(3000);
  });

  it("9. should test that instance name and admin emails exist on general tab", () => {
    cy.visit(routes.GENERAL);
    cy.get(adminsSettings.instanceName).should("be.visible");
    cy.get(adminsSettings.adminEmails).should("be.visible");
  });

  it("10. should test that configure link redirects to google maps setup doc", () => {
    cy.visit(routes.GOOGLE_MAPS);
    cy.get(adminsSettings.readMoreLink).within(() => {
      cy.get("a")
        .should("have.attr", "target", "_blank")
        .invoke("removeAttr", "target")
        .click();
      cy.url().should("contain", GOOGLE_MAPS_SETUP_DOC);
    });
  });

  it(
    "excludeForAirgap",
    "11. should test that authentication page redirects",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.googleButton).click();
      cy.url().should("contain", routes.GOOGLEAUTH);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.githubButton).click();
      cy.url().should("contain", routes.GITHUBAUTH);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.formloginButton).click();
      cy.url().should("contain", routes.FORMLOGIN);
    },
  );

  it(
    "airgap",
    "11. should test that authentication page redirects and google and github auth doesn't exist - airgap",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.googleButton).should("not.exist");
      cy.get(adminsSettings.githubButton).should("not.exist");
      cy.get(adminsSettings.formloginButton).click();
      cy.url().should("contain", routes.FORMLOGIN);
    },
  );

  it(
    "excludeForAirgap",
    "12. should test that configure link redirects to google signup setup doc",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.googleButton).click();
      cy.url().should("contain", routes.GOOGLEAUTH);
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
    "13. should test that configure link redirects to github signup setup doc",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.githubButton).click();
      cy.url().should("contain", routes.GITHUBAUTH);
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click();
        cy.url().should("contain", GITHUB_SIGNUP_SETUP_DOC);
      });
    },
  );

  it(
    "excludeForAirgap",
    "14. should test that read more on version opens up release notes",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a").click();
      });
      cy.wait(2000);
      cy.get(".ads-v2-modal__content").should("be.visible");
      cy.get(".ads-v2-modal__content-header").should("be.visible");
      cy.get(".ads-v2-modal__content-header").should(
        "contain",
        "Product updates",
      );
      cy.get(".ads-v2-button__content-icon-start").should("be.visible");
      cy.get(".ads-v2-button__content-icon-start").click();
      cy.wait(2000);
      cy.get(".ads-v2-modal__content").should("not.exist");
    },
  );

  it(
    "airgap",
    "14. should test that read more on version is hidden for airgap",
    () => {
      cy.visit(routes.GENERAL);
      cy.get(adminsSettings.versionTab).click();
      cy.url().should("contain", routes.VERSION);
      cy.get(adminsSettings.readMoreLink).should("not.exist");
    },
  );

  it("15. should test that settings page is not accessible to normal users", () => {
    cy.LogOut();
    cy.wait(2000);
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(".admin-settings-menu-option").should("not.exist");
    cy.visit(routes.GENERAL);
    // non super users are redirected to home page
    cy.url().should("contain", routes.APPLICATIONS);
    cy.LogOut();
  });
});
