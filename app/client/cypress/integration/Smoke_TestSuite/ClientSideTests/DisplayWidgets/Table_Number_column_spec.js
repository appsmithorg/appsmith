/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/basicTabledsl.json");
const testData = require("../../../../fixtures/numberKeyTableData.json");

describe("Validate Table Widget Table Data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check number key in table data convert table binding and header properly", function() {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", JSON.stringify(testData));

    // check table header name
    cy.get(".draggable-header")
      .eq(0)
      .should("have.text", "_1");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
