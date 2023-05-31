describe("Help Button on editor", function () {
  it("1. Chat with us and Intercom consent should be visible on Help Menu", () => {
    cy.visit("/applications");
    cy.wait(5000);
    cy.get(".t--new-button").click();
    cy.wait(5000);
    cy.get("[data-testid='t--help-button']").click();
    cy.wait(1000);
    cy.get("#intercom-trigger").click();
    cy.wait(1000);
    cy.get("[data-testid='t--intercom-consent-text']");
  });
});
