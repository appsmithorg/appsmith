import locators from "../../../../locators/AdminsSettings";
import LicenseLocators from "../../../../locators/LicenseLocators.json";

describe("License expired", function () {
  it(
    "excludeForAirgap",
    "1. should show ADMIN license expiry page",
    function () {
      cy.interceptLicenseApi({
        licenseStatus: "EXPIRED",
        licenseType: "PAID",
        active: false,
      });
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.visit("/applications");
      cy.wait(2000);
      cy.url().should("contain", "/license");
      cy.get(LicenseLocators.noSubscriptionText).should(
        "have.text",
        "No active subscription",
      );
      cy.get(LicenseLocators.licenseCheckPageSubHeaderText).should(
        "have.text",
        "Kindly choose one of the following option to get started",
      );

      cy.get(LicenseLocators.licenseCheckForm).within(() => {
        cy.get(LicenseLocators.licenseFormInput).should(
          "have.attr",
          "placeholder",
          "Add key",
        );
        cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");
      });

      cy.get(LicenseLocators.getTrialLicenseCard).within(() => {
        cy.get(LicenseLocators.getTrialLicenseLabel).should(
          "have.text",
          "If you do not have a license key, please visit our customer portal to start trial or buy a subscription",
        );
        cy.get(LicenseLocators.getTrialLicenseBtn).should(
          "have.text",
          "Visit customer portal",
        );
      });
      cy.get(locators.appsmithHeader).should("be.visible");
      cy.get(locators.appsmithHeader).within(() => {
        cy.get(".t--profile-menu-icon").click();
      });
      cy.wait(1000);
      cy.get(LicenseLocators.signOutBtn).click();
      cy.wait(1000);
      cy.url().should("contain", "/login");
    },
  );
  it(
    "airgap",
    "1. should show ADMIN license expiry page for airgap",
    function () {
      cy.interceptLicenseApi({
        licenseStatus: "EXPIRED",
        licenseType: "PAID",
        active: false,
      });
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.visit("/applications");
      cy.wait(2000);
      cy.url().should("contain", "/license");
      cy.get(LicenseLocators.noSubscriptionText).should(
        "have.text",
        "No active subscription",
      );
      cy.get(LicenseLocators.licenseCheckPageSubHeaderText).should("not.exist");

      cy.get(LicenseLocators.licenseCheckForm).within(() => {
        cy.get(LicenseLocators.licenseFormInput).should(
          "have.attr",
          "placeholder",
          "Add key",
        );
        cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");
      });

      cy.get(LicenseLocators.getTrialLicenseCard).should("not.exist");
      cy.get(locators.appsmithHeader).should("be.visible");
      cy.get(locators.appsmithHeader).within(() => {
        cy.get(".t--profile-menu-icon").click();
      });
      cy.wait(1000);
      cy.get(LicenseLocators.signOutBtn).click();
      cy.wait(1000);
      cy.url().should("contain", "/login");
    },
  );
  it("2. should show NON ADMIN license expiry page", function () {
    cy.interceptLicenseApi({
      licenseStatus: "EXPIRED",
      licenseType: "PAID",
      active: false,
    });
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.wait(2000);
    cy.url().should("contain", "/license");
    cy.get(".t--error-page-description").should(
      "have.text",
      "You currently do not have an active subscription. Please contact your instance administrator to activate the instance.",
    );
    cy.get(locators.appsmithHeader).should("be.visible");
    cy.get(locators.appsmithHeader).within(() => {
      cy.get(".t--profile-menu-icon").click();
    });
    cy.wait(1000);
    cy.get(LicenseLocators.signOutBtn).click();
    cy.wait(1000);
    cy.url().should("contain", "/login");
  });
});
