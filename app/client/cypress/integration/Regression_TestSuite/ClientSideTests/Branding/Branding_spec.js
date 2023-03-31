const commonlocators = require("../../../../locators/commonlocators.json");
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

const locators = {
  AdminSettingsEntryLink: ".admin-settings-menu-option",
  LeftPaneBrandingLink: ".t--settings-category-branding",
  AdminSettingsColorInput: ".t--settings-brand-color-input input[type=text]",
  AdmingSettingsLogoInput: ".t--settings-brand-logo-input input[type=file]",
  AdmingSettingsLogoInputImage: ".t--settings-brand-logo-input img",
  AdmingSettingsFaviconInput:
    ".t--settings-brand-favicon-input input[type=file]",
  AdmingSettingsFaviconInputImage: ".t--settings-brand-favicon-input img",
  BrandingBg: ".t--branding-bg",
  BrandingLogo: ".t--branding-logo",
  BrandingFavicon: "img.t--branding-favicon",
  BrandingFaviconHead: "link.t--branding-favicon",
  dashboardAppTab: ".t--apps-tab",
  createNewAppButton: ".t--new-button",
  loginContainer: ".t--login-container",
  signupLink: ".t--signup-link",
  authContainer: ".t--auth-container",
  submitButton: "button[type='submit']",
  appsmithLogo: ".t--appsmith-logo",
  appsmithLogoImg: ".t--appsmith-logo img",
  AdminSettingsColorInputShades: ".t--color-input-shades",
};

describe("Branding", () => {
  it("1. Super user can access branding page", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.url().should("contain", "/settings/general");
    cy.get(locators.LeftPaneBrandingLink).should("be.visible");
    cy.get(locators.LeftPaneBrandingLink).click();
    cy.wait(2000);
  });

  it("2. Should test that changing logo,favicon and color changes the preview", () => {
    // branding color
    cy.get(locators.AdminSettingsColorInput).focus().clear().type("red");

    cy.get(".t--branding-bg").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)",
    );

    // branding logo
    cy.get(locators.AdmingSettingsLogoInput).attachFile("appsmithlogo.png");
    cy.wait(1000);
    cy.get(locators.AdmingSettingsLogoInputImage).should("be.visible");
    cy.get(locators.BrandingLogo)
      .invoke("attr", "src")
      .then((src) => {
        cy.get(locators.AdmingSettingsLogoInputImage)
          .invoke("attr", "src")
          .should("equal", src);
      });

    // branding favicon
    cy.get(locators.AdmingSettingsFaviconInput).attachFile("appsmithlogo.png");
    cy.wait(1000);
    cy.get(locators.AdmingSettingsFaviconInputImage).should("be.visible");
    cy.get(locators.BrandingFavicon)
      .invoke("attr", "src")
      .then((src) => {
        cy.get(locators.AdmingSettingsFaviconInputImage)
          .invoke("attr", "src")
          .should("equal", src);
      });

    // validations - logo
    cy.get(locators.AdmingSettingsLogoInput).attachFile("testFile.mov");
    cy.wait(1000);
    cy.get(commonlocators.toastMsg).contains(
      Cypress.env("MESSAGES").ADMIN_BRANDING_LOGO_FORMAT_ERROR(),
    );

    // validations - favicon
    cy.get(locators.AdmingSettingsFaviconInput).attachFile("testFile.mov");
    cy.wait(1000);
    cy.get(commonlocators.toastMsg).contains(
      Cypress.env("MESSAGES").ADMIN_BRANDING_FAVICON_FORMAT_ERROR(),
    );
  });

  it("3. Check if localStorage is populated with tenantConfig values & form cannot be submitted", () => {
    if (CURRENT_REPO === REPO.CE) {
      const tenantConfig = localStorage.getItem("tenantConfig");
      expect(tenantConfig).to.be.null;
      cy.get(locators.submitButton).should("be.disabled");
    }
  });
});
