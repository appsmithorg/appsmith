const dsl = require("../../../../fixtures/TextTabledsl.json");

describe("Property pane connections error state", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if the connection shows an error state when a connection has an error", function() {
    cy.openPropertyPane("tablewidget");

    cy.testJsontext("tabledata", "{{error}}");

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.searchText}}");

    // Find class which indicates an error
    cy.get(".t--connection-error");
  });
});
