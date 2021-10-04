const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget new column type - Rating", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test change column type to Rating and test onchange", function() {
    cy.openPropertyPane("tablewidget");
    // Open column detail to be edited
    cy.editColumn("userName");
    // Changing Column data type from "Plain text" to "Rating"
    cy.changeColumnType("Rating");
    // check cell changed to Rating
    cy.getTableCell("1", "2", "*[class^='component__RateContainer']").then(
      (cell) => {
        expect(cell.length).to.be.equal(1);
      },
    );
    // test onchange
    cy.onTableAction(0, "onchange", `{{currentRow.productName}}`);
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] *[class^='component__RateContainer'] > span > span`,
    )
      .first()
      .click({ force: true });

    cy.get(commonlocators.toastmsg).contains(
      testdata.TablePagination[1].productName,
    );

    // test max count
    cy.testJsontext("maxcount", `{{currentRow.orderAmount > 10 ? 5 : 7}}`);
    // 2nd cell of 3rd column
    cy.getTableCell(
      "1",
      "2",
      "*[class^='component__RateContainer'] > span > span",
    ).then((cell) => {
      expect(cell.length).to.be.equal(7);
    });
    // 3rd cell of 3rd column
    cy.getTableCell(
      "2",
      "2",
      "*[class^='component__RateContainer'] > span > span",
    ).then((cell) => {
      expect(cell.length).to.be.equal(5);
    });

    cy.closePropertyPane();
  });
});
