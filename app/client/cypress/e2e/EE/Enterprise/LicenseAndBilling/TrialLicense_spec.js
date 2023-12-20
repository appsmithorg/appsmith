import LicenseLocators from "../../../../locators/LicenseLocators.json";
import commonlocators from "../../../../locators/commonlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Trial License",
  { tags: ["@tag.LicenseAndBilling"] },
  function () {
    before(() => {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "TRIAL",
      });
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    });
    it("1. should show warning banner and upgrade CTA on left pane on Homepage", function () {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "TRIAL",
      });
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.wait(2000);
      _.agHelper.AssertElementAbsence(LicenseLocators.welcomeBanner);
      _.agHelper.AssertElementVisibility(LicenseLocators.upgradeLeftPane, true);
      _.agHelper.AssertElementVisibility(LicenseLocators.billingBanner, true);
    });
    it("2. should have 30 days left in the trial", () => {
      cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "TRIAL" });
      cy.get(LicenseLocators.billingBanner).contains(
        "Your trial will expire in 30 days. Upgrade to continue using all the features",
      );

      // should have yellow background
      _.agHelper.AssertCSS(
        LicenseLocators.billingBanner,
        "background-color",
        "rgb(255, 251, 235)",
      );
    });
    it("3. should have red banner for trial left less than 3 days", () => {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "TRIAL",
        expiry: (new Date().getTime() + 2 * 24 * 60 * 60 * 1000) / 1000,
      });
      cy.reload();
      cy.get(LicenseLocators.billingBanner).contains(
        "Your trial will expire in 2 days. Upgrade to continue using all the features",
      );

      // should have yellow background
      _.agHelper.AssertCSS(
        LicenseLocators.billingBanner,
        "background-color",
        "rgb(255, 251, 235)",
      );

      // should take the user to customer portal on clicking upgrade CTA
      cy.get(LicenseLocators.billingBanner)
        .find("a")
        .should("have.attr", "href", "https://customer.appsmith.com/plans");
    });
    it("4. should have red banner with hours remaining in the trial license", () => {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "TRIAL",
        expiry: (new Date().getTime() + 8 * 60 * 60 * 1000 + 60 * 1000) / 1000,
      });
      cy.reload();
      cy.get(LicenseLocators.billingBanner).contains(
        "Your trial will expire in 8 hours. Upgrade to continue using all the features",
      );
    });
    it("5. should not have banner in paid license", () => {
      cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "PAID" });
      cy.reload();
      cy.get(LicenseLocators.billingBanner).should("not.exist");
    });
  },
);
