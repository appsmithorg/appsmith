import LicenseLocators from "../../../../locators/LicenseLocators.json";
import AppNavigation from "../../../../locators/AppNavigation.json";

describe("License and Billing dashboard", function () {
  it("1. Go to admin settings and click on License & Billing tab", function () {
    // Mock license key and license origin from API
    cy.interceptLicenseApi({
      licenseOrigin: "SELF_SERVE",
    });
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    // click license and billing tab
    cy.get(LicenseLocators.billingDashboardTab).click();
    cy.url().should("contain", "/settings/billing");
    cy.wait(2000);
    cy.get(LicenseLocators.billingHeader).within(() => {
      cy.get(".header-text").should("have.text", "License & billing");
    });
  });
  it("1. Go to admin settings and click on License & Billing tab", function () {
    // Mock license key and license origin from API
    cy.interceptLicenseApi({
      licenseOrigin: "ENTERPRISE",
    });
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(".admin-settings-menu-option").should("be.visible");
    cy.get(".admin-settings-menu-option").click();
    cy.url().should("contain", "/settings/general");
    // click license and billing tab
    cy.get(LicenseLocators.billingDashboardTab).click();
    cy.url().should("contain", "/settings/billing");
    cy.wait(2000);
    cy.get(LicenseLocators.billingHeader).within(() => {
      cy.get(".header-text").should("have.text", "License & billing");
    });
  });
  it(
    "excludeForAirgap",
    "2. should have two cards - Billing and usage, License key",
    function () {
      cy.get(LicenseLocators.dashboardCard).should("have.length", 2);
    },
  );
  it(
    "airgap",
    "2. should have only one cards in airgap - License key card",
    function () {
      cy.get(LicenseLocators.dashboardCard).should("have.length", 1);
    },
  );
  it("excludeForAirgap", "3. Billing and usage card", function () {
    cy.get(LicenseLocators.dashboardCard)
      .eq(0)
      .within(() => {
        cy.get(LicenseLocators.dashboardCardTitle).should(
          "have.text",
          "Billing & usage",
        );
        cy.get(LicenseLocators.portalBtn).should("have.text", "Portal");
        cy.get(LicenseLocators.portalBtn).should(
          "have.attr",
          "href",
          "https://customer.appsmith.com/plans",
        );
      });
  });
  it(
    "airgap",
    "3. Billing and usage card shouldn't exist in airgap",
    function () {
      cy.get(LicenseLocators.dashboardCard)
        .eq(0)
        .within(() => {
          cy.get(LicenseLocators.dashboardCardTitle).should(
            "have.text",
            "License key",
          );
        });
    },
  );
  it(
    "excludeForAirgap",
    "3. License key card - ACTIVE license - Business",
    function () {
      // Mock license key and license origin from API
      cy.interceptLicenseApi({
        licenseOrigin: "SELF_SERVE",
        licenseKey: "VALIxxxxxxxxx KEY",
      });
      cy.reload();
      cy.wait(2000);
      cy.get(LicenseLocators.dashboardCard)
        .eq(1)
        .within(() => {
          cy.get(LicenseLocators.dashboardCardTitle).should(
            "have.text",
            "License key",
          );
          cy.get(LicenseLocators.statusText)
            .find("span")
            .should("have.text", "Business");
          cy.get(LicenseLocators.licenseKeyText).should(
            "have.text",
            "VALIxxxxxxxxx KEY",
          );
          cy.get(LicenseLocators.licenseExpirationDate).should("not.exist");
          cy.get(".update-license-btn").should("have.text", "Update");
          cy.get(".update-license-btn").click();
        });

      cy.wait(2000);
      cy.get(AppNavigation.modal).should("be.visible");

      cy.get(AppNavigation.modal).within(() => {
        cy.get(AppNavigation.modalHeader).within(() => {
          cy.xpath(LicenseLocators.licenseModalHeader).should(
            "have.text",
            "Update license",
          );
        });
        cy.get(".license-form").within(() => {
          cy.get(LicenseLocators.licenseFormInput).should(
            "have.attr",
            "placeholder",
            "Paste your license key here",
          );
          cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");
        });
        cy.get(LicenseLocators.licenseFormInput).type("INVALID-LICENSE-KEY");
        cy.get(LicenseLocators.activeInstanceBtn).click();
        cy.wait(2000);
        cy.request({
          method: "PUT",
          url: "/api/v1/tenants/license",
          body: { key: "INVALID-LICENSE-KEY" },
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 400);
      });
      cy.get(AppNavigation.modalClose).click();
      cy.wait(2000);
      cy.get(AppNavigation.modal).should("not.exist");
    },
  );
  it(
    "excludeForAirgap",
    "3. License key card - ACTIVE license - Enterprise",
    function () {
      // Mock license key and license origin from API
      cy.interceptLicenseApi({
        licenseOrigin: "ENTERPRISE",
        licenseKey: "VALIxxxxxxxxx KEY",
      });
      cy.reload();
      cy.wait(2000);
      cy.get(LicenseLocators.dashboardCard)
        .eq(1)
        .within(() => {
          cy.get(LicenseLocators.dashboardCardTitle).should(
            "have.text",
            "License key",
          );
          cy.get(LicenseLocators.statusText)
            .find("span")
            .should("have.text", "Enterprise");
          cy.get(LicenseLocators.licenseKeyText).should(
            "have.text",
            "VALIxxxxxxxxx KEY",
          );
          cy.get(LicenseLocators.licenseExpirationDate).should("not.exist");
          cy.get(".update-license-btn").should("have.text", "Update");
          cy.get(".update-license-btn").click();
        });

      cy.wait(2000);
      cy.get(AppNavigation.modal).should("be.visible");

      cy.get(AppNavigation.modal).within(() => {
        cy.get(AppNavigation.modalHeader).within(() => {
          cy.xpath(LicenseLocators.licenseModalHeader).should(
            "have.text",
            "Update license",
          );
        });
        cy.get(".license-form").within(() => {
          cy.get(LicenseLocators.licenseFormInput).should(
            "have.attr",
            "placeholder",
            "Paste your license key here",
          );
          cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");
        });
        cy.get(LicenseLocators.licenseFormInput).type("INVALID-LICENSE-KEY");
        cy.get(LicenseLocators.activeInstanceBtn).click();
        cy.wait(2000);
        cy.request({
          method: "PUT",
          url: "/api/v1/tenants/license",
          body: { key: "INVALID-LICENSE-KEY" },
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 400);
      });
      cy.get(AppNavigation.modalClose).click();
      cy.wait(2000);
      cy.get(AppNavigation.modal).should("not.exist");
    },
  );
  it("excludeForAirgap", "4.License key card - TRIAL license", function () {
    const expiry =
      (new Date("25 Feb 2023").getTime() + 2 * 24 * 60 * 60 * 1000) / 1000;
    cy.interceptLicenseApi({
      licenseOrigin: "SELF_SERVE",
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      expiry,
    });
    cy.reload();
    cy.wait(2000);
    cy.get(LicenseLocators.dashboardCard)
      .eq(1)
      .within(() => {
        cy.get(LicenseLocators.dashboardCardTitle).should(
          "have.text",
          "License key",
        );
        cy.get(LicenseLocators.statusText)
          .find("span")
          .should("have.text", "Business");
        cy.get(LicenseLocators.licenseExpirationDate).should("be.visible");
        cy.getDateString(expiry * 1000).then((date) => {
          cy.get(LicenseLocators.licenseExpirationDate).should(
            "have.text",
            `Valid until: ${date}`,
          );
        });
      });
  });
  it("airgap", "4.License key card - TRIAL license - airgap", function () {
    const expiry =
      (new Date("25 Feb 2023").getTime() + 2 * 24 * 60 * 60 * 1000) / 1000;
    cy.interceptLicenseApi({
      licenseOrigin: "AIR_GAP",
      licenseStatus: "ACTIVE",
      licenseType: "TRIAL",
      expiry,
    });
    cy.reload();
    cy.wait(2000);
    cy.get(LicenseLocators.dashboardCard)
      .eq(0)
      .within(() => {
        cy.get(LicenseLocators.dashboardCardTitle).should(
          "have.text",
          "License key",
        );
        cy.get(LicenseLocators.statusText)
          .find("span")
          .should("have.text", "Airgapped");
        cy.get(LicenseLocators.licenseExpirationDate).should("be.visible");
        cy.getDateString(expiry * 1000).then((date) => {
          cy.get(LicenseLocators.licenseExpirationDate).should(
            "have.text",
            `Valid until: ${date}`,
          );
        });
      });
  });
});
