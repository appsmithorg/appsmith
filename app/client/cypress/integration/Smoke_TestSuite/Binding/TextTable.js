const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/TextTabledsl.json");

describe("Text-Table Binding Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Text-Table Binding Functionality For Username", function() {
    cy.openPropertyPane("tablewidget");
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", JSON.stringify(this.data.textfun));
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTabledata("1", "2").then(tabData => {
      const tabValue = `\"${tabData}\"`;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
    });
  });
  afterEach(() => {
    // put your clean up code if any
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
