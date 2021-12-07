const dsl = require("../../../../fixtures/tableWithTextWidgetDsl.json");
const apiWidgetslocator = require("../../../../locators/commonlocators.json");

describe("Table widget edge case scenario testing", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Check if the selectedRowIndices does not contain -1", function() {
    cy.openPropertyPane("tablewidget");

    cy.get(apiWidgetslocator.deflautSelectedRow).should("have.text", "0");
  });
});
