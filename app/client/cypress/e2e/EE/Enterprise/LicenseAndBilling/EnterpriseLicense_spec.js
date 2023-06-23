import LicenseLocators from "../../../../locators/LicenseLocators.json";

describe("Enterprise License Origin", function () {
  it("1. Should not show License & Billing tab in admin settings", function () {
    const expiry =
      (new Date("25 Feb 2023").getTime() + 2 * 24 * 60 * 60 * 1000) / 1000;
    cy.interceptLicenseApi({
      licenseStatus: "ACTIVE",
      licenseType: "PAID",
      expiry,
      licenseOrigin: "ENTERPRISE",
    });
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    // license and billing tab should not exist
    cy.get(LicenseLocators.billingDashboardTab).should("not.exist");
  });
});
