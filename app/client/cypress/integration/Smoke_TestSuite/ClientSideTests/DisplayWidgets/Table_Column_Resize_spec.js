/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableResizedColumnsDsl.json");

describe("Table Widget Functionality with Hidden and Resized Columns", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality with Hidden and Resized Columns", function() {
    cy.PublishtheApp();
    // Verify column header width should be equal to table width
    cy.get(".t--widget-tablewidget")
      .invoke("outerWidth")
      .then((tableWidth) => {
        cy.get(".t--widget-tablewidget .thead .tr")
          .invoke("outerWidth")
          .then((columnHeaderWidth) => {
            expect(columnHeaderWidth).to.be.at.least(tableWidth);
          });
      });
  });
});
