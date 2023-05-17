import LicenseLocators from "../../../../locators/LicenseLocators.json";

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
      cy.get(".header-text").should("have.text", "License & Billing");
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
          "Billing & Usage",
        );
        cy.get(".portal-btn").should("have.text", "PORTAL");
        cy.window().then((win) => {
          cy.stub(win, "open").as("windowOpen");
        });
        cy.get(".portal-btn").click();
        cy.get("@windowOpen").should(
          "be.calledWith",
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
            "License Key",
          );
        });
    },
  );
  it("excludeForAirgap", "3. License key card - ACTIVE license", function () {
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
          "License Key",
        );
        cy.get(LicenseLocators.statusText)
          .should("have.text", "ACTIVE")
          .should("have.css", "color", "rgb(3, 179, 101)");
        cy.get(LicenseLocators.statusBadge).should(
          "have.css",
          "background-color",
          "rgb(229, 246, 236)",
        );
        cy.get(LicenseLocators.licenseKeyText).should(
          "have.text",
          "VALIxxxxxxxxx KEY",
        );
        cy.get(LicenseLocators.licenseExpirationDate).should("not.exist");
        cy.get(".update-license-btn").should("have.text", "UPDATE");
        cy.get(".update-license-btn").click();
      });

    cy.wait(2000);
    cy.get(".bp3-dialog").should("be.visible");

    cy.get(".bp3-dialog").within(() => {
      cy.get(".bp3-dialog-body").within(() => {
        cy.root().contains("Update License");
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
      cy.get(".bp3-dialog-close-button").click();
    });
    cy.wait(2000);
    cy.get(".bp3-dialog").should("not.exist");
  });
  it("excludeForAirgap", "4.License key card - TRIAL license", function () {
    const expiry =
      (new Date("25 Feb 2023").getTime() + 2 * 24 * 60 * 60 * 1000) / 1000;
    cy.interceptLicenseApi({
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
          "License Key",
        );
        cy.get(LicenseLocators.statusText)
          .should("have.text", "TRIAL")
          .should("have.css", "color", "rgb(3, 179, 101)");
        cy.get(LicenseLocators.statusBadge).should(
          "have.css",
          "background-color",
          "rgb(229, 246, 236)",
        );
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
          "License Key",
        );
        cy.get(LicenseLocators.statusText)
          .should("have.text", "TRIAL")
          .should("have.css", "color", "rgb(3, 179, 101)");
        cy.get(LicenseLocators.statusBadge).should(
          "have.css",
          "background-color",
          "rgb(229, 246, 236)",
        );
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
