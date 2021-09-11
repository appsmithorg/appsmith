const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Table Widget new column type - Select", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  const dropdownOptions = [
    { label: "Michael Lawson", value: "Michael Lawson" },
    { label: "Lindsay Ferguson", value: "Lindsay Ferguson" },
    { label: "Tobias Funke", value: "Tobias Funke" },
    { label: "John Robson", value: "John Robson" },
  ];

  it("Test change column type to select", function() {
    cy.openPropertyPane("tablewidget");
    // Open column detail to be edited
    cy.editColumn("userName");
    // Changing Column data type from "Plain text" to "Select"
    cy.changeColumnType("Select");
    cy.testJsontext("options", JSON.stringify(dropdownOptions));
    cy.closePropertyPane();
    // check cell changed to select
    cy.getTableCell("1", "2", ".bp3-control-group .bp3-popover-target").then(
      (cell) => {
        expect(cell.length).to.be.equal(1);
      },
    );
  });

  it("Test Select new value and verity on option change action", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("userName");
    cy.onTableAction(0, "onoptionchange", "Option is selected");
    // get 3rd cell of 2nd row
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=2] .bp3-control-group .bp3-popover-target`,
    ).click({ force: true });
    // select last option from dropdown
    cy.get(".select-popover-wrapper " + commonlocators.singleSelectMenuItem)
      .contains(dropdownOptions[3].value)
      .click({ force: true });
    cy.wait(2000);
    cy.get(commonlocators.toastmsg).contains("Option is selected");
    // Reading single cell value of the table and verify it's value.
    cy.readTableSelectPublish("1", "2").then((tabData) => {
      expect(tabData).to.be.equal(dropdownOptions[3].value);
    });
    cy.closePropertyPane();
  });

  it("Test add new column and set default option for select", function() {
    cy.openPropertyPane("tablewidget");
    // Add new column in the table with name "CustomColumn"
    cy.addColumn("CustomColumn");
    cy.editColumn("customColumn1");
    // Changing Column data type from "Plain text" to "Select"
    cy.changeColumnType("Select");
    cy.testJsontext("options", JSON.stringify(dropdownOptions));

    cy.closePropertyPane();
    // Reading single cell value of the table and verify it's value.
    // no option selected
    cy.readTableSelectPublish("1", "5").then((tabData) => {
      expect(tabData).to.be.equal("-- Select --");
    });

    // get 5th cell of 2nd row
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=5] .bp3-control-group .bp3-popover-target`,
    ).click({ force: true });
    // select last option from dropdown
    cy.get(".select-popover-wrapper " + commonlocators.singleSelectMenuItem)
      .contains(dropdownOptions[1].value)
      .click({ force: true });
    // Reading single cell value of the table and verify it's value.
    cy.readTableSelectPublish("1", "5").then((tabData) => {
      expect(tabData).to.be.equal(dropdownOptions[1].value);
    });
  });
});
