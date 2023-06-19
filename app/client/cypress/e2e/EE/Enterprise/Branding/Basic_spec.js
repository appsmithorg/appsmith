const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
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

describe.skip("Branding", () => {
  let logo;
  let favicon;
  let shades = {};

  it("1. check if localStorage is populated with tenantConfig values", () => {
    if (CURRENT_REPO === REPO.CE) {
      const tenantConfig = localStorage.getItem("tenantConfig");

      expect(tenantConfig).to.be.null;
    }

    if (CURRENT_REPO === REPO.EE) {
      const tenantConfig = localStorage.getItem("tenantConfig");

      expect(tenantConfig).to.not.be.null;
    }
  });

  it.skip("2. Check if localStorage is populated with tenantConfig values & form cannot be submitted", () => {
    if (CURRENT_REPO === REPO.EE) {
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

  it.skip(
    "excludeForAirgap",
    "2. checks branding on dashboard and checks if colorpicker has branding colors",
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

        // check the apps tab border bottom
        cy.get(locators.dashboardAppTab).then(($x) => {
          const win = $x[0].ownerDocument.defaultView;
          const after = win.getComputedStyle($x[0], "::after");
          const backgroundColor = after.getPropertyValue("background-color");
          expect(backgroundColor).to.eq(shades.primary);
        });

        // check the button bg
        cy.get(`${locators.createNewAppButton} div`).should(
          "have.css",
          "background-color",
          shades.primary,
        );

        // create new app
        cy.get(locators.createNewAppButton).eq(0).click({ force: true });

        _.appSettings.OpenAppSettings();
        _.appSettings.GoToThemeSettings();

        cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
        cy.get(widgetsPage.colorPickerV2PopoverContent).contains(
          "Brand Colors",
        );
      }
    },
  );

  it.skip(
    "airgap",
    "1. checks branding on dashboard and checks if colorpicker has branding colors - airgap",
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

        // check the apps tab border bottom
        cy.get(locators.dashboardAppTab).then(($x) => {
          const win = $x[0].ownerDocument.defaultView;
          const after = win.getComputedStyle($x[0], "::after");
          const backgroundColor = after.getPropertyValue("background-color");
          expect(backgroundColor).to.eq(shades.primary);
        });

        // check the button bg
        cy.get(`${locators.createNewAppButton} div`).should(
          "have.css",
          "background-color",
          shades.primary,
        );

        // create new app
        cy.get(locators.createNewAppButton).eq(0).click({ force: true });

        _.appSettings.OpenAppSettings();
        _.appSettings.GoToThemeSettings();

        cy.get(widgetsPage.colorPickerV2Popover).click({ force: true }).click();
        cy.get(widgetsPage.colorPickerV2PopoverContent).contains(
          "Brand Colors",
        );
      }
    },
  );

  it.skip("3. checks branding colors on login page", () => {
    if (CURRENT_REPO === REPO.EE) {
      // logout user
      cy.window().its("store").invoke("dispatch", { type: "LOGOUT_USER_INIT" });
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
