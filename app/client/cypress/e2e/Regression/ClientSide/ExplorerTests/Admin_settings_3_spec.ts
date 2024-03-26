/// <reference types="cypress-tags" />
import adminsSettings from "../../../../locators/AdminsSettings";
import { agHelper } from "../../../../support/Objects/ObjectsCore";

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
  VERSION: "/settings/version",
  ADVANCED: "/settings/advanced",
};

describe(
  "Admin settings page",
  { tags: ["@tag.IDE", "@tag.excludeForAirgap"] },
  function () {
    it("1. should test that authentication page redirects", () => {
      cy.visit(routes.GENERAL, { timeout: 60000 });
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
    });

    it("2. should test that configure link redirects to google signup setup doc", () => {
      cy.visit(routes.GENERAL, { timeout: 60000 });
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.googleButton).click();
      cy.url().should("contain", routes.GOOGLEAUTH);
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click()
          .wait(3000); //for page to load fully;
        cy.url().should("contain", GOOGLE_SIGNUP_SETUP_DOC);
      });
    });

    it("3. should test that configure link redirects to github signup setup doc", () => {
      cy.visit(routes.GENERAL, { timeout: 60000 });
      cy.get(adminsSettings.authenticationTab).click();
      cy.url().should("contain", routes.AUTHENTICATION);
      cy.get(adminsSettings.githubButton).click();
      cy.url().should("contain", routes.GITHUBAUTH);
      cy.get(adminsSettings.readMoreLink).within(() => {
        cy.get("a")
          .should("have.attr", "target", "_blank")
          .invoke("removeAttr", "target")
          .click()
          .wait(3000); //for page to load fully
        cy.url().should("contain", GITHUB_SIGNUP_SETUP_DOC);
      });
    });

    it("4. should test that read more on version opens up release notes", () => {
      cy.visit(routes.GENERAL, { timeout: 60000 });
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
    });

    it("5. should test that settings page tab redirects not airgap", () => {
      agHelper.VisitNAssert(routes.APPLICATIONS, "getConsolidatedData");
      cy.get(".admin-settings-menu-option").click();
      cy.wait("@getEnvVariables");
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
    });
  },
);
