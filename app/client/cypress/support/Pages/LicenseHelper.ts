export class License {
  public UpdateLicenseKey(type?: "business" | "enterprise") {
    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        key:
          type === "business"
            ? "BUSINESS-PAID-LICENSE-KEY"
            : "VALID-LICENSE-KEY",
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  }

  public RemoveLicenseKey() {
    cy.request({
      method: "DELETE",
      url: "/api/v1/tenants/license",
      headers: {
        "Content-Type": "application/json",
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  }
}
