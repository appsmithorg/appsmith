const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2NewDslWithPagination.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Verify table column type changes effect on menuButton and iconButton", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.get(".t--property-control-totalrecords pre.CodeMirror-line span span")
      .click()
      .type("26");
    cy.wait(1000);
    cy.get(`.t--draggable-tablewidgetv2 span[data-pagecount="20"]`).should(
      "exist",
    );

    cy.closePropertyPane();
  });
});
