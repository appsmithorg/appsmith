import LicenseLocators from "../locators/LicenseLocators.json";
import { ObjectsRegistry } from "./Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;

Cypress.Commands.add("validateLicense", () => {
  agHelper.GetNAssertElementText(
    LicenseLocators.noSubscriptionText,
    "How do you want to get started?",
  );

  agHelper.GetNAssertElementText(
    LicenseLocators.licenseCheckPageSubHeaderText,
    "Our free plan is great for solo developers and small teams.",
  );

  agHelper.AssertElementVisibility(LicenseLocators.licenseFreeCard);
  agHelper.AssertElementVisibility(LicenseLocators.licensePaidCard);

  agHelper.GetNClick(LicenseLocators.licenseCheckPaidButton);

  agHelper.Sleep(2000);

  cy.get(LicenseLocators.licenseFormInput).should(
    "have.attr",
    "placeholder",
    "Add key",
  );
  cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");

  if (Cypress.env("AIRGAPPED")) {
    cy.get(LicenseLocators.licenseFormInput)
      .clear()
      .type(Cypress.env("OFFLINE_LICENSE_KEY"));
    cy.get(LicenseLocators.activeInstanceBtn).click();
    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      body: {
        key: Cypress.env("OFFLINE_LICENSE_KEY"),
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  } else {
    cy.get(LicenseLocators.licenseFormInput).type("INVALID-LICENSE-KEY");
    cy.get(LicenseLocators.activeInstanceBtn).click();
    cy.wait(2000);

    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      body: {
        key: "INVALID-LICENSE-KEY",
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 400);
    cy.wait(1000);
    cy.get(LicenseLocators.licenseFormInput).clear().type("VALID-LICENSE-KEY");
    cy.get(LicenseLocators.activeInstanceBtn).click();
    cy.wait(2000);
    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      body: { key: "VALID-LICENSE-KEY" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  }
  cy.wait("@getWorkspace");
  cy.visit("/applications");
  cy.wait(4000);
});

Cypress.Commands.add(
  "interceptLicenseApi",
  ({
    active = true, //30 days from now
    expiry = (new Date().getTime() + 30 * 24 * 60 * 60 * 1000) / 1000,
    licenseKey,
    licenseOrigin,
    licenseStatus,
    licenseType,
    licenseKey,
    active = true,
    licenseOrigin,
    plan,
    productEdition,
    url = "/api/v1/tenants/current",
    method = "GET",
  }) => {
    cy.intercept(method, url, (req) => {
      req.continue((res) => {
        const modifiedResponse = {
          ...res,
          body: {
            ...res.body,
            data: {
              ...res.body.data,
              tenantConfiguration: {
                ...res.body.data.tenantConfiguration,
                license: {
                  ...res.body.data.tenantConfiguration.license,
                  ...(licenseKey && { key: licenseKey }),
                  ...(licenseStatus && { status: licenseStatus }),
                  ...(licenseType && { type: licenseType }),
                  ...(licenseOrigin && { origin: licenseOrigin }),
                  ...(plan && { plan: plan }),
                  ...(productEdition && { productEdition: productEdition }),
                  expiry,
                  active,
                },
              },
            },
          },
        };
        res.send(modifiedResponse);
      });
    }).as("licenseApiMock");
  },
);

Cypress.Commands.add("getDateString", (timestamp) => {
  function getDateSuffix(date) {
    const parsedDate = Number(date);
    if (date !== "" && date !== null && typeof parsedDate === "number") {
      const j = parsedDate % 10,
        k = parsedDate % 100;

      if (j == 1 && k != 11) {
        return "st";
      }
      if (j == 2 && k != 12) {
        return "nd";
      }
      if (j == 3 && k != 13) {
        return "rd";
      }

      return "th";
    } else {
      return "";
    }
  }

  if (timestamp) {
    const [, month, date, year] = new Date(timestamp).toDateString().split(" ");
    return `${date}${getDateSuffix(date)} ${month} ${year}`;
  } else {
    return createMessage(NOT_AVAILABLE);
  }
});
