const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import {
  agHelper,
  homePage,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

const locators = {
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
  businessTag: ".business-tag",
  upgradeBanner: ".upgrade-banner",
  upgradeButton: "[data-testid='t--button-upgrade']",
};

describe("Branding", { tags: ["@tag.Settings"] }, () => {
  let logo;
  let favicon;
  let shades = {};

  it("1. check if localStorage is populated with organizationConfig values", () => {
    if (CURRENT_REPO === REPO.CE) {
      const organizationConfig = localStorage.getItem("organizationConfig");

      expect(organizationConfig).to.be.null;
    }

    if (CURRENT_REPO === REPO.EE) {
      const organizationConfig = localStorage.getItem("organizationConfig");

      expect(organizationConfig).to.not.be.null;
    }
  });

  it("2. Super user can access branding page", () => {
    cy.LogOut(false);
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(adminSettings._adminSettingsBtn).should("be.visible");
    cy.get(adminSettings._adminSettingsBtn).click();
    cy.url().should("contain", adminSettings.routes.PROFILE);
    agHelper.AssertElementVisibility(locators.LeftPaneBrandingLink);
    agHelper.GetNClick(locators.LeftPaneBrandingLink);
  });

  it("3. Should test that changing logo,favicon and color changes the preview", () => {
    // branding color
    cy.get(locators.AdminSettingsColorInput).focus().clear().type("red");

    cy.get(".t--branding-bg").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)",
    );

    // branding logo
    cy.get(locators.AdmingSettingsLogoInput).selectFile(
      "cypress/fixtures/appsmithlogo.png",
      { force: true },
    );

    agHelper.AssertElementVisibility(locators.AdmingSettingsLogoInputImage);
    agHelper.WaitForCondition(() => {
      cy.get(locators.BrandingLogo)
        .invoke("attr", "src")
        .then((src) => {
          cy.get(locators.AdmingSettingsLogoInputImage)
            .invoke("attr", "src")
            .should("equal", src);
        });
    });

    // branding favicon
    cy.get(locators.AdmingSettingsFaviconInput).selectFile(
      "cypress/fixtures/appsmithlogo.png",
      { force: true },
    );
    agHelper.AssertElementVisibility(locators.AdmingSettingsFaviconInputImage);
    cy.get(locators.BrandingFavicon)
      .invoke("attr", "src")
      .then((src) => {
        cy.get(locators.AdmingSettingsFaviconInputImage)
          .invoke("attr", "src")
          .should("equal", src);
      });

    // validations - logo
    cy.get(locators.AdmingSettingsLogoInput).selectFile(
      "cypress/fixtures/testFile.mov",
      { force: true },
    );
    agHelper.ValidateToastMessage(
      Cypress.env("MESSAGES").ADMIN_BRANDING_LOGO_FORMAT_ERROR(),
    );
    // validations - favicon
    cy.get(locators.AdmingSettingsFaviconInput).selectFile(
      "cypress/fixtures/testFile.mov",
      { force: true },
    );
    agHelper.ValidateToastMessage(
      Cypress.env("MESSAGES").ADMIN_BRANDING_FAVICON_FORMAT_ERROR(),
    );
  });

  it("4. Check if localStorage is populated with organizationConfig values & form cannot be submitted", () => {
    if (CURRENT_REPO === REPO.CE) {
      const organizationConfig = localStorage.getItem("organizationConfig");
      expect(organizationConfig).to.be.null;
      cy.get(locators.submitButton).should("be.disabled");
    }

    if (CURRENT_REPO === REPO.EE) {
      featureFlagIntercept({ license_branding_enabled: true });

      cy.wait(2000);

      // branding color
      cy.get(locators.AdminSettingsColorInput).focus().clear().type("red");

      // branding logo
      cy.get(locators.AdmingSettingsLogoInput).selectFile(
        "cypress/fixtures/appsmithlogo.png",
        { force: true },
      );

      // branding favicon
      cy.get(locators.AdmingSettingsFaviconInput).selectFile(
        "cypress/fixtures/appsmithfavicon.png",
        { force: true },
      );

      // click on submit button
      cy.get(locators.submitButton).click();
      cy.wait(2000);

      cy.get(commonlocators.toastMsg).contains("Successfully saved");

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

  it(
    "checks branding on dashboard and checks if colorpicker has branding colors",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      if (CURRENT_REPO === REPO.EE) {
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

        // create new app
        homePage.CreateNewApplication();

        _.appSettings.OpenAppSettings();
        _.appSettings.GoToThemeSettings();

        cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
        cy.get(widgetsPage.colorPickerV2PopoverContent).contains(
          "Brand Colors",
        );
      }
    },
  );

  it(
    "airgap",
    "checks branding on dashboard and checks if colorpicker has branding colors - airgap",
    () => {
      if (CURRENT_REPO === REPO.EE) {
        // naivagae to dashboard
        cy.get(locators.appsmithLogo).click();
        let airgappedLogo = logo;
        let airgappedFavicon = favicon;
        if (logo.startsWith("http://" || "https://")) {
          airgappedLogo = `${window.location.origin}/${logo.split("/").pop()}`;
        } else if (favicon.startsWith("http://" || "https://")) {
          airgappedFavicon = `${window.location.origin}/${favicon
            .split("/")
            .pop()}`;
        }
        cy.get(locators.appsmithLogoImg)
          .invoke("attr", "src")
          .should("eq", airgappedLogo);

        // check favicon
        cy.get(locators.BrandingFaviconHead)
          .invoke("attr", "href")
          .should("eq", airgappedFavicon);

        // create new app
        homePage.CreateNewApplication();

        _.appSettings.OpenAppSettings();
        _.appSettings.GoToThemeSettings();

        cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
        cy.get(widgetsPage.colorPickerV2PopoverContent).contains(
          "Brand Colors",
        );
      }
    },
  );

  it("5.checks branding colors on login page", () => {
    if (CURRENT_REPO === REPO.EE) {
      // logout user
      _.homePage.InvokeDispatchOnStore();
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

  it("6. Super user sees upgrade option in branding page in free plan", () => {
    cy.LogOut(false);
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(adminSettings._adminSettingsBtn).should("be.visible");
    cy.get(adminSettings._adminSettingsBtn).click();
    cy.url().should("contain", adminSettings.routes.PROFILE);

    cy.get(locators.LeftPaneBrandingLink).should("be.visible");
    cy.get(locators.LeftPaneBrandingLink).click();
    cy.wait(2000);

    featureFlagIntercept({ license_branding_enabled: false });
    cy.get(locators.submitButton).should("be.disabled");
    cy.get(locators.businessTag).should("be.visible");
    cy.get(locators.upgradeBanner).should("be.visible");
    cy.get(locators.upgradeBanner)
      .find("h1")
      .should("have.text", "Custom Branding for your workspaces");
    cy.get(locators.upgradeBanner)
      .find("h2")
      .should(
        "have.text",
        Cypress.env("MESSAGES").ADMIN_BRANDING_SETTINGS_SUBTITLE_UPGRADE(),
      );
    cy.get(locators.upgradeButton)
      .should("be.visible")
      .should("have.text", "Upgrade");
  });
});
