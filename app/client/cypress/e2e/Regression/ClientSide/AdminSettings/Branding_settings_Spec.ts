import {
  agHelper,
  adminSettings,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import AdminsSettings from "../../../../locators/AdminsSettings";

describe(
  "Admin Branding Page - Branding page validations",
  { tags: ["@tag.Settings"] },
  () => {
    it("1. Verify branding data update for community user", () => {
      adminSettings.NavigateToAdminSettings();
      agHelper.AssertElementVisibility(AdminsSettings.LeftPaneBrandingLink);
      agHelper.GetNClick(AdminsSettings.LeftPaneBrandingLink);

      // branding logo PNG
      cy.get(AdminsSettings.AdmingSettingsLogoInput).selectFile(
        "cypress/fixtures/appsmithlogo.png",
        { force: true },
      );
      agHelper.AssertElementAbsence(locators._toastMsg);
      agHelper.AssertElementVisibility(
        AdminsSettings.AdmingSettingsLogoInputImage,
      );
      agHelper.WaitForCondition(() => {
        cy.get(AdminsSettings.BrandingLogo)
          .invoke("attr", "src")
          .then((src) => {
            cy.get(AdminsSettings.AdmingSettingsLogoInputImage)
              .invoke("attr", "src")
              .should("equal", src);
          });
      });

      // branding logo jpg
      cy.get(AdminsSettings.AdmingSettingsLogoInput).selectFile(
        "cypress/fixtures/AAAFlowerVase.jpeg",
        { force: true },
      );
      agHelper.AssertElementAbsence(locators._toastMsg);
      agHelper.AssertElementVisibility(
        AdminsSettings.AdmingSettingsLogoInputImage,
      );
      agHelper.WaitForCondition(() => {
        cy.get(AdminsSettings.BrandingLogo)
          .invoke("attr", "src")
          .then((src) => {
            cy.get(AdminsSettings.AdmingSettingsLogoInputImage)
              .invoke("attr", "src")
              .should("equal", src);
          });
      });

      // branding logo svg
      // comment due to bug: https://github.com/appsmithorg/appsmith/issues/34329
      // cy.get(AdminsSettings.AdmingSettingsLogoInput).selectFile(
      //   "cypress/fixtures/appsmith-community-logo.svg",
      //   { force: true },
      // );
      // agHelper.AssertElementAbsence(locators._toastMsg);

      // agHelper.AssertElementVisibility(
      //   AdminsSettings.AdmingSettingsLogoInputImage,
      // );
      // agHelper.WaitForCondition(() => {
      //   cy.get(AdminsSettings.BrandingLogo)
      //     .invoke("attr", "src")
      //     .then((src) => {
      //       cy.get(AdminsSettings.AdmingSettingsLogoInputImage)
      //         .invoke("attr", "src")
      //         .should("equal", src);
      //     });
      // });

      // branding favicon png
      cy.get(AdminsSettings.AdmingSettingsFaviconInput).selectFile(
        "cypress/fixtures/branding_sample.png",
        { force: true },
      );
      agHelper.AssertElementAbsence(locators._toastMsg);
      agHelper.AssertElementVisibility(
        AdminsSettings.AdmingSettingsFaviconInputImage,
      );
      cy.get(AdminsSettings.BrandingFavicon)
        .invoke("attr", "src")
        .then((src) => {
          cy.get(AdminsSettings.AdmingSettingsFaviconInputImage)
            .invoke("attr", "src")
            .should("equal", src);
        });

      // branding favicon jpg
      cy.get(AdminsSettings.AdmingSettingsFaviconInput).selectFile(
        "cypress/fixtures/branding_samplejpg.jpg",
        { force: true },
      );
      agHelper.AssertElementAbsence(locators._toastMsg);

      // branding favicon ico
      cy.get(AdminsSettings.AdmingSettingsFaviconInput).selectFile(
        "cypress/fixtures/branding_sampleICO.ico",
        { force: true },
      );
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
  },
);
