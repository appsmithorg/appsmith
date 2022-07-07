const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test to add column", function() {
    cy.openPropertyPane("tablewidget");
    // Adding new column
    cy.addColumn("CustomColumn");
    cy.tableColumnDataValidation("customColumn1"); //To be updated later
    // Hiding all other columns in the table from property pane
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    // Validating the newly added column
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
  });

  it("Edit column name and validate test for computed value", function() {
    // Open column detail by draggable id of the column
    cy.editColumn("customColumn1");
    // Validating single cell value
    cy.readTabledataPublish("1", "2").then(() => {
      // Chaging the computed value to "Emails"
      cy.updateComputedValue(testdata.currentRowWithIdOutside);
      // Validating single cell value
      cy.readTabledataPublish("1", "1").then((tabData) => {
        expect(tabData).to.be.equal("#lindsay.ferguson@reqres.in");
        cy.log("computed value of plain text " + tabData);
      });
    });
  });
});
