const dsl = require("../../../../../fixtures/tableV2AndTextDsl.json");

describe("Table Widget v2 property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table widget v2 new menu button column should not deselect row", function() {
    cy.openPropertyPane("tablewidgetv2");

    cy.get(".t--widget-textwidget").should("have.text", "0");
    cy.contains("Open Menu").click({
      force: true,
    });
    cy.wait(1000);
    cy.get(".t--widget-textwidget").should("have.text", "0");
  });
});
