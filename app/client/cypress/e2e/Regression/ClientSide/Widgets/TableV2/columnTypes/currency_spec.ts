import * as _ from "../../../../../../support/Objects/ObjectsCore";

const tableData = `{{[
  {
    "amount": 10000.01,
  },
]}}`;

function updateCellValue(value) {
  cy.editTableCell(0, 0);
  cy.enterTableCellValue(0, 0, value);
  cy.saveTableCellValue(0, 0);
  _.agHelper.Sleep(500);
}

describe("Currency column", { tags: ["@tag.Widget", "@tag.Table"] }, () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300, 400);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      `{{Table1.editableCell.value}}|{{Table1.editableCell.inputValue}}|{{typeof Table1.editableCell.value}}|{{typeof Table1.editableCell.inputValue}}`,
    );

    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
    _.propPane.EnterJSContext("Table data", tableData);
    _.table.toggleColumnEditableViaColSettingsPane("amount", "v2", true, true);
  });

  it("1. should test that currency column is available", () => {
    cy.editColumn("amount");
    cy.changeColumnType("Currency");
    cy.get(".t--property-control-currency").should("exist");
  });

  it("2. should test that currency column properties are displayed and working", () => {
    cy.get(".t--property-control-currency").should("exist");

    cy.get(".t--property-control-decimalsallowed").should("exist");

    cy.get(".t--property-control-notation").should("exist");

    cy.get(".t--property-control-thousandseparator").should("exist");
  });

  it("3. should test that currency column is formatted correctly", () => {
    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("$ 10,000");
    });

    _.propPane.ToggleJSMode("Currency", true);

    _.propPane.EnterJSContext("Currency", "INR");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10,000");
    });

    _.propPane.SelectPropertiesDropDown("Decimals allowed", "1");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10,000.0");
    });

    _.propPane.SelectPropertiesDropDown("Decimals allowed", "2");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10,000.01");
    });

    _.propPane.TogglePropertyState("Thousand separator", false);

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10000.01");
    });

    _.propPane.SelectPropertiesDropDown("Notation", "Compact");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10.00K");
    });

    _.propPane.SelectPropertiesDropDown("Decimals allowed", "0");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 10K");
    });
  });

  it("4. shoudl test that currency column is editable", () => {
    _.propPane.SelectPropertiesDropDown("Notation", "Standard");

    updateCellValue("1,234.23");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 123423");
    });

    _.propPane.SelectPropertiesDropDown("Decimals allowed", "1");

    updateCellValue("4321.23");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 4321.2");
    });

    _.propPane.SelectPropertiesDropDown("Decimals allowed", "2");

    updateCellValue("1234.23");

    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("₹ 1234.23");
    });

    cy.editTableCell(0, 0);

    cy.enterTableCellValue(0, 0, 6543.23);

    cy.get(".t--widget-textwidget .t--text-widget-container").should(
      "have.text",
      "6543.23|6543.23|number|string",
    );

    cy.saveTableCellValue(0, 0);
  });
});
