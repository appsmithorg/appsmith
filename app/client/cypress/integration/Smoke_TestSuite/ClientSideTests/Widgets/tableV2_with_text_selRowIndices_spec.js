const dsl = require("../../../../fixtures/tableV2WithTextWidgetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Table widget v2 edge case scenario testing", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Check if the selectedRowIndices does not contain -1", function() {
    cy.openPropertyPane("tablewidgetv2");

    //Update the property default selected row to blank
    cy.updateCodeInput(".t--property-control-defaultselectedrow", "");

    //Check if the evaluated value is undefined
    cy.get(commonlocators.evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .should("have.text", "-1");

    //Check the value present in the textfield which is selectedRowIndices is blank
    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should("have.text", "[]");

    //Enable the "Enable Multi Row selection"
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    //Check the value present in the textfield which is selectedRowIndices is []
    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should("have.text", "[]");

    //Select the 1st, 2nd and 3rd row
    cy.isSelectRow("0");
    cy.isSelectRow("1");
    cy.isSelectRow("2");

    //Check the value present in the textfield which is selectedRowIndices is [0,1,2]
    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
      "have.text",
      "[  0,  1,  2]",
    );
  });
});
//
