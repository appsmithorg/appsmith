import locators from "../../../../locators/AdminsSettings";
import LicenseLocators from "../../../../locators/LicenseLocators.json";
import { agHelper } from "../../../../support/Objects/ObjectsCore";

describe("License expired", function () {
  it("1. should show ADMIN license expiry page for airgap", function () {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait(2000);
    cy.interceptLicenseApi({
      licenseStatus: "EXPIRED",
      licenseType: "PAID",
      active: false,
      plan: "BUSINESS",
    });
    cy.reload();
    agHelper.AssertURL("/license");
    agHelper.GetNAssertElementText(
      LicenseLocators.noSubscriptionText,
      "Restart with Appsmith",
    );

    agHelper.GetNAssertElementText(
      LicenseLocators.billingBanner,
      "Your license key is no longer valid. Get a new license to continue using all the features.",
      "contain.text",
    );

    agHelper.AssertElementVisibility(LicenseLocators.licenseFreeCard);
    agHelper.AssertElementVisibility(LicenseLocators.licensePaidCard);

    agHelper.AssertElementVisibility(locators.appsmithHeader);

    cy.get(locators.appsmithHeader).within(() => {
      cy.get(".t--profile-menu-icon").click();
    });
    cy.wait(1000);
    agHelper.GetNClick(LicenseLocators.signOutBtn);
    cy.wait(1000);
    agHelper.AssertURL("/login");
  });
  it("2. should show NON ADMIN license expiry page", function () {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.wait(2000);
    cy.interceptLicenseApi({
      licenseStatus: "EXPIRED",
      licenseType: "PAID",
      active: false,
      plan: "BUSINESS",
    });
    cy.reload();
    cy.wait(2000);
    cy.url().should("contain", "/license");
    agHelper.AssertURL("/license");
    agHelper.GetNAssertElementText(
      LicenseLocators.licenseCheckPageSubHeaderText,
      "Your instance is currently inactive. Please contact your instance administrator to reactivate the instance.",
    );
    agHelper.AssertElementVisibility(locators.appsmithHeader);
    cy.get(locators.appsmithHeader).within(() => {
      cy.get(".t--profile-menu-icon").click();
    });
    cy.wait(1000);
    agHelper.GetNClick(LicenseLocators.signOutBtn);
    cy.wait(1000);
    agHelper.AssertURL("/login");
  });
});
