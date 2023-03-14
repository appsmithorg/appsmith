const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
const testdata = require("../../../../../fixtures/testdata.json");

describe("Table Widget V2 property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Test to add column", function() {
    cy.openPropertyPane("tablewidgetv2");
    // Adding new column
    cy.addColumnV2("CustomColumn");
    cy.tableV2ColumnDataValidation("customColumn1"); //To be updated later
    // Hiding all other columns in the table from property pane
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    // Validating the newly added column
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
  });

  it("2. Edit column name and validate test for computed value", function() {
    // Open column detail by draggable id of the column
    cy.editColumn("customColumn1");
    // Validating single cell value
    cy.readTableV2dataPublish("1", "2").then(() => {
      // Chaging the computed value to "Emails"
      cy.updateComputedValueV2(testdata.currentRowWithIdOutside);
      // Validating single cell value
      cy.readTableV2dataPublish("1", "1").then((tabData) => {
        expect(tabData).to.be.equal("#lindsay.ferguson@reqres.in");
        cy.log("computed value of plain text " + tabData);
      });
    });
  });
});
