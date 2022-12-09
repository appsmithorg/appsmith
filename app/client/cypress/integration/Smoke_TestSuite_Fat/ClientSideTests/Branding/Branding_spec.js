const commonlocators = require("../../../../locators/commonlocators.json");

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
  let logo;
  let favicon;
  let shades = {};

  it("super user can access branding page", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.url().should("contain", "/settings/general");
    cy.get(locators.LeftPaneBrandingLink).should("be.visible");
    cy.get(locators.LeftPaneBrandingLink).click();
    cy.wait(2000);

    cy.get("h2").contains(
      Cypress.env("MESSAGES").ADMIN_BRANDING_SETTINGS_TITLE(),
    );
    cy.get("h2 + div").contains(
      Cypress.env("MESSAGES").ADMIN_BRANDING_SETTINGS_SUBTITLE(),
    );
  });

  it("should test that changing logo,favicon and color changes the preview", () => {
    // branding color
    cy.get(locators.AdminSettingsColorInput)
      .focus()
      .clear()
      .type("red");

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

  it("checks if the form can be submitted", () => {
    if (Cypress.env("Edition") === 0) {
      cy.get(locators.submitButton).should("be.disabled");
    }

    if (Cypress.env("Edition") === 1) {
      // click on submit button
      cy.get(locators.submitButton).click();
      cy.wait(2000);

      cy.get(commonlocators.toastMsg).contains("Successfully Saved");

      // grab the favicon value
      cy.get(locators.AdmingSettingsFaviconInputImage)
        .invoke("attr", "src")
        .then((src) => {
          favicon = src;
        });

      // grab the logo value
      cy.get(locators.AdmingSettingsLogoInputImage)
        .invoke("attr", "src")
        .then((src) => {
          logo = src;
        });

      // grap the shades
      let currentColor;
      cy.get(locators.AdminSettingsColorInputShades)
        .find("div")
        .each(($el) => {
          cy.wrap($el)
            .invoke("css", "background-color")
            .then((color) => {
              currentColor = color;

              cy.wrap($el)
                .invoke("data", "id")
                .then((id) => {
                  shades[id] = currentColor;
                });
            });
        });
    }
  });

  it("checks branding on dashboard", () => {
    if (Cypress.env("Edition") === 1) {
      // naivagae to dashboard
      cy.get(locators.appsmithLogo).click();

      // check logo
      cy.get(locators.appsmithLogoImg)
        .invoke("attr", "src")
        .should("eq", logo);

      // check favicon
      cy.get(locators.BrandingFaviconHead)
        .invoke("attr", "href")
        .should("eq", favicon);

      // check the apps tab border bottom
      cy.get(locators.dashboardAppTab).should(
        "have.css",
        "border-bottom-color",
        shades.primary,
      );

      // check the button bg
      cy.get(locators.createNewAppButton).should(
        "have.css",
        "background-color",
        shades.primary,
      );
    }
  });

  it("checks branding colors on login page", () => {
    if (Cypress.env("Edition") === 1) {
      // logout user
      cy.window()
        .its("store")
        .invoke("dispatch", { type: "LOGOUT_USER_INIT" });
      cy.wait("@postLogout");

      cy.wait(2000);

      cy.get(locators.loginContainer).should(
        "have.css",
        "border-top-color",
        shades.primary,
      );

      cy.get(locators.signupLink).should("have.css", "color", shades.primary);

      cy.get(locators.authContainer).should(
        "have.css",
        "background-color",
        shades.background,
      );
    }
  });
});
