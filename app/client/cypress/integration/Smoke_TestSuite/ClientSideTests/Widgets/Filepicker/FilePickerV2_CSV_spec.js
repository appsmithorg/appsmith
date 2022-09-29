const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/filePickerTableDSL.json");

const widgetName = "filepickerwidgetv2";
const ARRAY_CSV_HELPER_TEXT = `All non csv filetypes will have an empty value`;

describe("File picker widget v2", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Parse CSV data to table Widget", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).should("not.exist");
    cy.selectDropdownValue(
      commonlocators.filePickerDataFormat,
      "Array (CSVs only)",
    );
    cy.get(commonlocators.filePickerDataFormat)
      .last()
      .should("have.text", "Array (CSVs only)");
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).should("exist");
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).contains(ARRAY_CSV_HELPER_TEXT);
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("Test_csv.csv");
    cy.wait(3000);

    cy.readTableV2dataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Black");
      cy.log("the value is" + tabValue);
    });
    cy.readTableV2dataPublish("1", "2").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("1000");
      cy.log("the value is" + tabValue);
    });
    cy.get(
      `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${1}][data-colindex=${3}] input`,
    ).should("not.be.checked");
  });
});
