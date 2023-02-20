import LicenseCheckPage from "../locators/LicenseLocators.json";

Cypress.Commands.add("validateLicense", () => {
  cy.get(LicenseCheckPage.noSubscriptionText).should(
    "have.text",
    "No active subscription",
  );
  cy.get(LicenseCheckPage.licenseCheckPageSubHeaderText).should(
    "have.text",
    "Kindly choose one of the following option to get started",
  );

  cy.get(LicenseCheckPage.licenseCheckForm).within(() => {
    cy.get(LicenseCheckPage.licenseFormInput).should(
      "have.attr",
      "placeholder",
      "Add Key",
    );
    cy.get(LicenseCheckPage.activeInstanceBtn).should("be.disabled");
  });

  cy.get(LicenseCheckPage.getTrialLicenseCard).within(() => {
    cy.get(LicenseCheckPage.getTrialLicenseLabel).should(
      "have.text",
      "If you do not have a license key, please visit our customer portal to start trial or buy a subscription",
    );
    cy.get(LicenseCheckPage.getTrialLicenseBtn).should(
      "have.text",
      "VISIT CUSTOMER PORTAL",
    );
  });

  cy.get(LicenseCheckPage.licenseFormInput).type("INVALID-LICENSE-KEY");
  cy.get(LicenseCheckPage.activeInstanceBtn).click();
  cy.wait(2000);
  cy.request({
    method: "PUT",
    url: "/api/v1/tenants/license",
    body: { key: "INVALID-LICENSE-KEY" },
    failOnStatusCode: false,
  })
    .its("status")
    .should("equal", 400);
  cy.wait(1000);
  cy.get(LicenseCheckPage.licenseFormInput)
    .clear()
    .type("VALID LICENSE KEY");
  cy.get(LicenseCheckPage.activeInstanceBtn).click();
  cy.wait(2000);
  cy.request({
    method: "PUT",
    url: "/api/v1/tenants/license",
    body: { key: "VALID LICENSE KEY" },
    failOnStatusCode: false,
  })
    .its("status")
    .should("equal", 200);
});
