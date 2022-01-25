/* eslint-disable cypress/no-unnecessary-waiting */
const dsl = require("../../../../fixtures/basicNumberDataTableDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Validate Table Widget Table Data", function() {
  it("Check number key in table data convert table binding and header properly", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("tablewidget", { x: 300, y: 300 });

    cy.openPropertyPane("tablewidget");

    // clear tabledata
    cy.clearPropertyValue("");
    // add new table data
    cy.testJsontext("tabledata", dsl.dsl.children[0].tableData);

    cy.contains('[role="columnheader"]', "_1").should("exist");
    cy.contains('[role="columnheader"]', "_2").should("exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
