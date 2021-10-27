const dsl = require("../../../../fixtures/StatboxDsl.json");

describe("Statbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Open Existing Statbox from created Widgets list", () => {
    cy.get(".widgets").click();
    cy.get(".t--entity .widget")
      .get(".entity-context-menu")
      .last()
      .click({ force: true });
  });
});
