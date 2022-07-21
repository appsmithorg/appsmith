/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2ResizedColumnsDsl.json");

describe("Table Widget V2 Functionality with Hidden and Resized Columns", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table Widget Functionality with Hidden and Resized Columns", function() {
    cy.PublishtheApp();
    // Verify column header width should be equal to table width
    cy.get(".t--widget-tablewidgetv2")
      .invoke("outerWidth")
      .then((tableWidth) => {
        cy.get(".t--widget-tablewidgetv2 .thead .tr")
          .invoke("outerWidth")
          .then((columnHeaderWidth) => {
            expect(columnHeaderWidth).to.be.at.least(tableWidth);
          });
      });
  });
});
