const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Table Widget new column type - Rating", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test change column type to Rating", function() {
    cy.openPropertyPane("tablewidget");
    // Open column detail to be edited
    cy.editColumn("userName");
    // Changing Column data type from "Plain text" to "Rating"
    cy.changeColumnType("Rating");
    cy.closePropertyPane();
    // check cell changed to Rating
    cy.getTableCell("1", "2", "*[class^='component__RateContainer']").then(
      (cell) => {
        expect(cell.length).to.be.equal(1);
      },
    );
  });

  it("Test Rating change and verity on change action", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("userName");
    cy.onTableAction(0, "onchange", "Rating is changed");
    // get 3rd cell of 2nd row
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] *[class^='component__RateContainer'] > span > span`,
    )
      .first()
      .click({ force: true });

    cy.get(commonlocators.toastmsg).contains("Rating is changed");
    cy.closePropertyPane();
  });
});
