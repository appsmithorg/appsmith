const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/filePickerTableDSL.json");

const widgetName = "filepickerwidgetv2";
const ARRAY_CSV_HELPER_TEXT = `All non CSV, XLS(X), JSON or TSV filetypes will have an empty value`;
const ObjectsRegistry =
  require("../../../../../support/Objects/Registry").ObjectsRegistry;
let propPane = ObjectsRegistry.PropertyPane;

describe("File picker widget v2", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Parse CSV,XLS,JSON,TSV,Binary,Text and Base64 file data to table Widget", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).should("not.exist");
    cy.selectDropdownValue(
      commonlocators.filePickerDataFormat,
      "Array of Objects (CSV, XLS(X), JSON, TSV)",
    );
    cy.get(commonlocators.filePickerDataFormat)
      .last()
      .should("have.text", "Array of Objects (CSV, XLS(X), JSON, TSV)");
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).should("exist");
    cy.get(
      `.t--property-control-dataformat ${commonlocators.helperText}`,
    ).contains(ARRAY_CSV_HELPER_TEXT);
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/Test_csv.csv", {
        force: true,
      });

    // wait for file to get uploaded
    cy.wait(3000);

    cy.readTableV2dataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Black");
    });
    cy.readTableV2dataPublish("1", "2").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("1000");
    });
    cy.get(
      `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${1}][data-colindex=${3}] input`,
    ).should("not.be.checked");
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Test for XLSX file
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/TestSpreadsheet.xlsx", { force: true });

    // wait for file to get uploaded
    cy.wait(3000);

    cy.readTableV2dataPublish("0", "0").then((tabData) => {
      expect(tabData).to.be.equal("Sheet1");
    });
    cy.readTableV2dataPublish("0", "1").then((tabData) => {
      expect(tabData).contains("Column A");
    });
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Test for XLS file
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/SampleXLS.xls", { force: true });

    // wait for file to get uploaded
    cy.wait(3000);

    cy.readTableV2dataPublish("0", "0").then((tabData) => {
      expect(tabData).to.be.equal("Sheet1");
    });
    cy.readTableV2dataPublish("0", "1").then((tabData) => {
      expect(tabData).contains("Dulce");
    });
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Test for JSON File
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/largeJSONData.json", { force: true });

    // wait for file to get uploaded
    cy.wait(3000);

    cy.readTableV2dataPublish("0", "2").then((tabData) => {
      expect(tabData).to.contain("sunt aut facere");
    });
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Test for TSV File
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/Sample.tsv", { force: true });

    // wait for file to get uploaded
    cy.wait(3000);

    cy.readTableV2dataPublish("0", "0").then((tabData) => {
      expect(tabData).to.be.equal("CONST");
    });
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Drag and drop a text widget for binding file data
    cy.dragAndDropToCanvas("textwidget", { x: 100, y: 100 });
    cy.openPropertyPane("textwidget");
    propPane.UpdatePropertyFieldValue("Text", `{{FilePicker1.files[0].data}}`);

    // Test for Base64
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Base64");
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/testdata.json", { force: true });
    cy.get(".t--widget-textwidget").should(
      "contain",
      "data:application/json;base64",
    );
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });

    // Test for Text file
    cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Text");
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/testdata.json", { force: true });
    cy.get(".t--widget-textwidget").should("contain", "baseUrl");
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });
    cy.wait(3000);
    cy.get(".t--widget-textwidget").should("have.text", "");

    cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Binary");
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/testdata.json", { force: true });
    cy.get(".t--widget-textwidget").should("contain", "baseUrl");
    cy.get(".uppy-Dashboard-Item-action--remove").click({ force: true });
  });
});
