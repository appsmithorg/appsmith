const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Table Widget new column type - Checkbox", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test change column type to Checkbox", function() {
    cy.openPropertyPane("tablewidget");
    // Open column detail to be edited
    cy.editColumn("userName");
    // Changing Column data type from "Plain text" to "Checkbox"
    cy.changeColumnType("Checkbox");
    cy.closePropertyPane();
    // check cell changed to Checkbox
    cy.getTableCell("1", "2", ".bp3-checkbox").then((cell) => {
      expect(cell.length).to.be.equal(1);
    });
  });

  it("Test Checkbox change and verity on change action", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("userName");
    cy.onTableAction(0, "oncheckchange", "Checkbox is changed");
    // get 3rd cell of 2nd row
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] .bp3-checkbox`,
    ).click({ force: true });

    cy.get(commonlocators.toastmsg).contains("Checkbox is changed");
    cy.closePropertyPane();
  });

  it("Test add new column and set Default Selected for Checkbox", function() {
    cy.openPropertyPane("tablewidget");
    // Add new column in the table with name "CustomColumn"
    cy.addColumn("CustomColumn");
    cy.editColumn("customColumn1");
    // Changing Column data type from "Plain text" to "Checkbox"
    cy.changeColumnType("Checkbox");
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleDefaultSelected).click({ force: true });
    cy.testJsontext("defaultselected", "true");

    cy.closePropertyPane();
    // column 1 and 2 both are default selected
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=5] .bp3-checkbox input[type="checkbox"]`,
    ).should("be.checked");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=2][data-colindex=5] .bp3-checkbox input[type="checkbox"]`,
    ).should("be.checked");
  });
});
