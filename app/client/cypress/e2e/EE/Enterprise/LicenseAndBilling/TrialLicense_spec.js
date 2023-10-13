import LicenseLocators from "../../../../locators/LicenseLocators.json";
import commonlocators from "../../../../locators/commonlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Trial License", function () {
  before(() => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
    });
    cy.window().then((win) => {
      win.localStorage.setItem("showLicenseBanner", JSON.stringify(true));
    });
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.window()
      .its("localStorage.showLicenseBanner")
      .should("eq", JSON.stringify(true));
    cy.wait(2000);
    cy.closeWelcomeBanner();
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
    _.agHelper.AssertElementVisibility(LicenseLocators.warningBanner, true);
  });
  it("2. should have 30 days left in the trial", () => {
    cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "TRIAL" });
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerMainText,
      "Your trial will expire in 30 days. ",
      "have.text",
    );

    // should have yellow background
    _.agHelper.AssertCSS(
      LicenseLocators.warningBanner,
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
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerMainText,
      "Your trial will expire in 2 days. ",
      "have.text",
    );

    // should have red background
    _.agHelper.AssertCSS(
      LicenseLocators.warningBanner,
      "background-color",
      "rgb(255, 242, 242)",
    );

    // should take the user to customer portal on clicking upgrade CTA
    cy.get(LicenseLocators.warningBanner).within(() => {
      cy.get(LicenseLocators.warningBannerUpgradeBtn).should(
        "have.attr",
        "href",
        "https://customer.appsmith.com/plans",
      );
    });
  });
  it("4. should have red banner with hours remaining in the trial license", () => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      expiry: (new Date().getTime() + 8 * 60 * 60 * 1000 + 60 * 1000) / 1000,
    });
    cy.reload();
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerMainText,
      "Your trial will expire in 8 hours. ",
      "have.text",
    );
  });
  it("5. should not have banner in paid license", () => {
    cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "PAID" });
    cy.reload();
    cy.get(LicenseLocators.warningBanner).should("not.exist");
  });
  it("6. should force recheck license on clicking recheck license CTA", () => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
    });
    cy.reload();
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerMainText,
      "Your trial will expire in 30 days. ",
      "have.text",
    );
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      url: "/api/v1/tenants/license",
    });
    _.agHelper.GetNClick(LicenseLocators.licenseRefreshBtn);
    cy.wait(1000);
    cy.get(commonlocators.toastMsg).contains(
      "Your license has been refreshed successfully",
    );
    _.agHelper.AssertElementAbsence(LicenseLocators.warningBanner);
  });
  it("7. should have Enterprise text in banner for Enterprise", () => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      plan: "ENTERPRISE",
      productEdition: "COMMERCIAL",
    });
    cy.reload();
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerContinueText,
      "Appsmith Enterprise",
      "contain.text",
    );
  });
  it("8. should have Business text in banner for Business", () => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      plan: "BUSINESS",
    });
    cy.reload();
    _.agHelper.GetNAssertElementText(
      LicenseLocators.warningBannerContinueText,
      "Appsmith Business",
      "contain.text",
    );
  });
});
