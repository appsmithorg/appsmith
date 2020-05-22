const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/TextTabledsl.json");

describe("Text-Table Binding Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Text-Table Binding Functionality For Id", function() {
    cy.openPropertyPane("tablewidget");
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.id}}");
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTabledata("1", "0").then(tabData => {
      const tabValue = tabData;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
    });
  });
  it("Text-Table Binding Functionality For Email", function() {
    cy.isSelectRow(2);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.email}}");
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTabledata("2", "1").then(tabData => {
      const tabValue = tabData;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
    });
  });
  it("Text-Table Binding Functionality For Total Length", function() {
    cy.pageNo(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.pageSize}}");
    cy.get(commonlocators.TableRow)
      .find("tr")
      .then(listing => {
        const listingCount = listing.length.toString();
        cy.get(commonlocators.TextInside).should("have.text", listingCount);
      });
  });
  it("Text-Table Binding Functionality For Username", function() {
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.pageNo(1);
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.userName}}");
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTabledata("1", "2").then(tabData => {
      const tabValue = tabData;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
    });
  });
  afterEach(() => {
    // put your clean up code if any
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
