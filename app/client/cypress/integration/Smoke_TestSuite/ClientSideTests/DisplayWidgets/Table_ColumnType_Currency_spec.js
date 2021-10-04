const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget new column type - Currency", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test change column type to Currency and test their properties", function() {
    cy.openPropertyPane("tablewidget");
    // Open column detail to be edited
    cy.editColumn("userName");
    // Changing Column data type from "Plain text" to "Switch"
    cy.changeColumnType("Currency");
    // check cell changed to Switch
    cy.getTableCell("1", "2", ".bp3-control-group .bp3-numeric-input").then(
      (cell) => {
        expect(cell.length).to.be.equal(1);
      },
    );
    // set values in property pane
    cy.get(widgetsPage.toggleCurrency)
      .first()
      .click({ force: true });
    cy.toggleJsAndUpdate(
      "currency",
      `{{currentRow.orderAmount > 10 ? "IN" : "AL"}}`,
    );
    cy.get(widgetsPage.toggleDecimals)
      .first()
      .click({ force: true });
    cy.toggleJsAndUpdate("decimals", `{{currentRow.orderAmount > 10 ? 1 : 2}}`);
    cy.onTableAction(0, "ontextchanged", `{{currentRow.productName}}`);

    // wtite into currency cell
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=0][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    )
      .clear()
      .type(2.2222)
      .blur();
    cy.wait(2000);
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    )
      .clear()
      .type(1.2222)
      .blur();
    cy.wait(2000);
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=2][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    )
      .clear()
      .type(3.2222)
      .blur();
    cy.wait(2000);

    // check ontextchanged
    cy.get(commonlocators.toastmsg).contains(
      testdata.TablePagination[2].productName,
    );

    // check cell currency symbol
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=0][data-colindex=2] .bp3-control-group .bp3-numeric-input > div`,
    ).should("have.text", "Lek");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] .bp3-control-group .bp3-numeric-input > div`,
    ).should("have.text", "Lek");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=2][data-colindex=2] .bp3-control-group .bp3-numeric-input > div`,
    ).should("have.text", "₹");
    // check cell input value
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=0][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    ).should("have.value", 2.22);
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    ).should("have.value", 1.22);
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=2][data-colindex=2] .bp3-control-group .bp3-numeric-input input[type='text']`,
    ).should("have.value", 3.2);
  });
});
