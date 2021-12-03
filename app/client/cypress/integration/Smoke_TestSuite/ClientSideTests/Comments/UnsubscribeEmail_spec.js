/// <reference types="Cypress" />

describe("Unsubscribe comment email test spec", function() {
  it("User can access unsubscribe page", function() {
    cy.visit("/unsubscribe/discussion/123456");
    cy.contains("Unsubscribe");
    cy.get("button")
      .contains("Unsubscribe me")
      .click();
    cy.contains("successfully unsubscribed");
  });
});
