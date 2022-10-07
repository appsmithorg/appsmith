const dsl = require("../../../../fixtures/displayWidgetDsl.json");

describe("Entity explorer tests related to pinning and unpinning", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("checks entity explorer visibility on unpin", function() {
    cy.wait(5000);
    cy.get(".t--entity-explorer").should("be.visible");
    cy.get(".t--pin-entity-explorer").click();
    cy.wait(5000);
    cy.get("[data-testid=widgets-editor]").click({ force: true });
    cy.wait(3000);
    cy.get(".t--entity-explorer").should("not.be.visible");
  });

  it("checks entity explorer visibility on pin", function() {
    cy.get(".t--pin-entity-explorer").click();
    cy.get(".t--entity-explorer").should("be.visible");
  });
});
