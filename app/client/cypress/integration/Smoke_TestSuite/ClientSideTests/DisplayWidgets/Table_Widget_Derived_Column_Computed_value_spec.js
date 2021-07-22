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
    cy.addColumn("CustomColumn");
    cy.tableColumnDataValidation("customColumn1"); //To be updated later
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
  });

  it("Edit column name and validate test for computed value", function() {
    cy.editColumn("customColumn1");
    cy.readTabledataPublish("1", "2").then(() => {
      cy.updateComputedValue(testdata.currentRowWithIdOutside);
      cy.readTabledataPublish("1", "1").then((tabData) => {
        expect(tabData).to.be.equal("#lindsay.ferguson@reqres.in");
        cy.log("computed value of plain text " + tabData);
      });
    });
  });
});
