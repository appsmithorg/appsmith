import LicenseLocators from "../locators/LicenseLocators.json";

Cypress.Commands.add("validateLicense", () => {
  cy.get(LicenseLocators.noSubscriptionText).should(
    "have.text",
    "No active subscription",
  );
  if (!Cypress.env("AIRGAPPED")) {
    cy.get(LicenseLocators.licenseCheckPageSubHeaderText).should(
      "have.text",
      "Kindly choose one of the following option to get started",
    );
  } else {
    cy.get(LicenseLocators.licenseCheckPageSubHeaderText).should("not.exist");
  }

  cy.get(LicenseLocators.licenseCheckForm).within(() => {
    cy.get(LicenseLocators.licenseFormInput).should(
      "have.attr",
      "placeholder",
      "Add Key",
    );
    cy.get(LicenseLocators.activeInstanceBtn).should("be.disabled");
  });

  if (!Cypress.env("AIRGAPPED")) {
    cy.get(LicenseLocators.getTrialLicenseCard).within(() => {
      cy.get(LicenseLocators.getTrialLicenseLabel).should(
        "have.text",
        "If you do not have a license key, please visit our customer portal to start trial or buy a subscription",
      );
      cy.get(LicenseLocators.getTrialLicenseBtn).should(
        "have.text",
        "VISIT CUSTOMER PORTAL",
      );
    });
  } else {
    cy.get(LicenseLocators.getTrialLicenseCard).should("not.exist");
  }
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
    cy.get(LicenseLocators.licenseFormInput).clear().type("VALID LICENSE KEY");
    cy.get(LicenseLocators.activeInstanceBtn).click();
    cy.wait(2000);
    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      body: { key: "VALID LICENSE KEY" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  }
});

Cypress.Commands.add(
  "interceptLicenseApi",
  ({
    expiry = (new Date().getTime() + 30 * 24 * 60 * 60 * 1000) / 1000, //30 days from now
    licenseStatus,
    licenseType,
    licenseKey,
    active = true,
    licenseOrigin,
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

Cypress.Commands.add("closeWelcomeBanner", () => {
  cy.get(LicenseLocators.welcomeBanner).should("be.visible");
  cy.get(LicenseLocators.welcomeBanner).within(() => {
    cy.get(".close-button").click();
  });
});
