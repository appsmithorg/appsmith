import adminSettings from "../../../../locators/AdminsSettings";

describe("Admin settings page", function() {
  beforeEach(() => {
    cy.intercept("GET", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("getEnvVariables");
    cy.intercept("PUT", "/api/v1/admin/env", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("postEnvVariables");
  });

  it("should test that embed settings options are visible", () => {
    cy.visit("/settings/general");
    cy.get(adminSettings.embedSettings).should("be.visible");
  });
});
