import LicenseLocators from "../../../../locators/LicenseLocators.json";
import commonlocators from "../../../../locators/commonlocators.json";

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
    cy.get(LicenseLocators.welcomeBanner).should("not.exist");
    cy.get(LicenseLocators.upgradeLeftPane).should("be.visible");
    cy.get(LicenseLocators.warningBanner).should("be.visible");
  });
  it("2. should have 30 days left in the trial", () => {
    cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "TRIAL" });
    cy.get(LicenseLocators.warningBannerMainText).should(
      "have.text",
      "Your trial will expire in 30 days. ",
    );
    // should have yellow background
    cy.get(LicenseLocators.warningBanner).should(
      "have.css",
      "background-color",
      "rgb(255, 248, 226)",
    );
  });
  it("3. should have red banner for trial left less than 3 days", () => {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      expiry: (new Date().getTime() + 2 * 24 * 60 * 60 * 1000) / 1000,
    });
    cy.reload();
    cy.get(LicenseLocators.warningBannerMainText).should(
      "have.text",
      "Your trial will expire in 2 days. ",
    );
    // should have red background
    cy.get(LicenseLocators.warningBanner).should(
      "have.css",
      "background-color",
      "rgb(253, 228, 228)",
    );
    // should take the user to customer portal on clicking upgrade CTA
    cy.get(LicenseLocators.warningBanner).within(() => {
      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen");
      });
      cy.get(LicenseLocators.warningBannerUpgradeBtn).click();
      cy.get("@windowOpen").should(
        "be.calledWith",
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
    cy.get(LicenseLocators.warningBannerMainText).should(
      "have.text",
      "Your trial will expire in 8 hours. ",
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
    cy.get(LicenseLocators.warningBannerMainText).should(
      "have.text",
      "Your trial will expire in 30 days. ",
    );
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      url: "/api/v1/tenants/license",
    });
    cy.get(LicenseLocators.licenseRefreshBtn).click();
    cy.wait(1000);
    cy.get(commonlocators.toastMsg).contains(
      "Your license has been updated successfully",
    );
    cy.get(LicenseLocators.warningBanner).should("not.exist");
  });
});
