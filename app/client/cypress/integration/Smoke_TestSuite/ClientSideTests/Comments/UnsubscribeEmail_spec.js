/// <reference types="Cypress" />

describe("Unsubscribe comment email test spec", function() {
  it("User can access unsubscribe page", function() {
    cy.visit("/unsubscribe/discussion/123456");
    cy.get("button")
      .contains(Cypress.env("MESSAGES").UNSUBSCRIBE_BUTTON_LABEL())
      .click();
    cy.contains(Cypress.env("MESSAGES").UNSUBSCRIBE_EMAIL_SUCCESS());
  });
});
