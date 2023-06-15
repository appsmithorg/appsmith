import LicenseLocators from "../../../../locators/LicenseLocators.json";

describe("excludeForAirgap", "Payment Failed License Banner", function () {
  it("1. should show payment failure banner for tenants with payment failure", function () {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      licenseStatus: "IN_GRACE_PERIOD",
    });
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.wait(2000);
    cy.get(LicenseLocators.warningBanner).should("be.visible");
  });

  it("2. should show payment failure banner for tenants with payment failure with red color for less than 3 days", function () {
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      licenseStatus: "IN_GRACE_PERIOD",
      expiry: (new Date().getTime() + 2 * 24 * 60 * 60 * 1000) / 1000,
    });
    cy.reload();
    cy.get(LicenseLocators.warningBannerMainText).should(
      "have.text",
      "Your last payment has failed.",
    );
    cy.get(LicenseLocators.warningBanner).should(
      "have.css",
      "background-color",
      "rgb(255, 242, 242)",
    );
    cy.get(LicenseLocators.warninngBannerContinueText).should(
      "have.text",
      "your payment methods to continue using Appsmith, else all your instances will shut down in 2 days.",
    );
  });

  it("3. should not have banner in paid license", () => {
    cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "PAID" });
    cy.reload();
    cy.get(LicenseLocators.warningBanner).should("not.exist");
  });

  it("4. should not show payment failure banner for tenants with payment failure for non admin users", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      licenseStatus: "IN_GRACE_PERIOD",
    });
    cy.reload();
    cy.wait(2000);
    cy.get(LicenseLocators.wrapperBanner).should("not.exist");
  });
});
