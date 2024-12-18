const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  assertHelper,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

const widgetName = "filepickerwidgetv2";
const ARRAY_CSV_HELPER_TEXT = `All non CSV, XLS(X), JSON or TSV filetypes will have an empty value`;

describe(
  "File picker widget v2",
  { tags: ["@tag.Widget", "@tag.Filepicker", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("filePickerTableDSL");
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

      agHelper.AssertText(
        commonlocators.filePickerDataFormat,
        "text",
        "Array of Objects (CSV, XLS(X), JSON, TSV)",
      );

      cy.get(
        `.t--property-control-dataformat ${commonlocators.helperText}`,
      ).should("exist");
      cy.get(
        `.t--property-control-dataformat ${commonlocators.helperText}`,
      ).contains(ARRAY_CSV_HELPER_TEXT);

      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/Test_csv.csv", {
          force: true,
        });

      // wait for file to get uploaded
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      // The table takes a bit of time to load the values in the cells
      table.WaitUntilTableLoad(0, 0, "v2");

      cy.readTableV2dataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Black");
      });
      cy.readTableV2dataPublish("1", "2").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("1000");
      });
      cy.get(
        `${locators._widgetInDeployed(
          "tablewidgetv2",
        )} .tbody .td[data-rowindex=${1}][data-colindex=${3}] input`,
      ).should("not.be.checked");

      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Test for XLSX file
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/TestSpreadsheet.xlsx", { force: true });

      // wait for file to get uploaded
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      // The table takes a bit of time to load the values in the cells
      table.WaitUntilTableLoad(0, 0, "v2");

      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.be.equal("Sheet1");
      });
      cy.readTableV2dataPublish("0", "1").then((tabData) => {
        expect(tabData).contains("Column A");
      });
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Test for XLS file
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/SampleXLS.xls", { force: true });

      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.be.equal("Sheet1");
      });
      cy.readTableV2dataPublish("0", "1").then((tabData) => {
        expect(tabData).contains("Dulce");
      });
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Test for JSON File
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/largeJSONData.json", { force: true });

      // wait for file to get uploaded
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      // The table takes a bit of time to load the values in the cells
      table.WaitUntilTableLoad(0, 0, "v2");

      cy.readTableV2dataPublish("0", "2").then((tabData) => {
        expect(tabData).to.contain("sunt aut facere");
      });
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Test for TSV File
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/Sample.tsv", { force: true });

      // wait for file to get uploaded
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      // The table takes a bit of time to load the values in the cells
      table.WaitUntilTableLoad(0, 0, "v2");

      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.be.equal("CONST");
      });
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Drag and drop a text widget for binding file data
      cy.dragAndDropToCanvas("textwidget", { x: 100, y: 100 });
      cy.openPropertyPane("textwidget");
      propPane.UpdatePropertyFieldValue(
        "Text",
        `{{FilePicker1.files[0].data}}`,
      );

      // Test for Base64
      cy.openPropertyPane(widgetName);
      cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Base64");
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testdata.json", { force: true });
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "data:application/json;base64",
      );
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      // Test for Text file
      cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Text");
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testdata.json", { force: true });
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "baseUrl",
      );
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);

      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      // The text widget takes a bit of time to load the values
      cy.wait(2000);

      agHelper.AssertText(locators._widgetInDeployed("textwidget"), "text", "");

      cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Binary");
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testdata.json", { force: true });
      agHelper.GetNAssertContains(
        locators._widgetInDeployed("textwidget"),
        "baseUrl",
      );
      agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);
    });
  },
);
