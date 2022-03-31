const dsl = require("../../../../fixtures/buttonGroupDsl.json");

describe("Widget Grouping", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Button widgets widget on click info message valdiation ", function() {
    cy.wait(20000);
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
  });
});
