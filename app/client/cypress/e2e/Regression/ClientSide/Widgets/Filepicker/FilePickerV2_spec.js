import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetName = "filepickerwidgetv2";

describe(
  "File picker widget v2",
  { tags: ["@tag.All", "@tag.Filepicker", "@tag.Binding"] },
  () => {
    it("1. Drag & drop FilePicker/Text widgets", () => {
      cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
      cy.get(widgetsPage.filepickerwidgetv2).should("exist");
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{FilePicker1.isDirty}}`,
      );
    });

    it("2. Check isDirty meta property", function () {
      // Check if initial value of isDirty is false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Upload a new file
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testFile.mov", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
    });

    it("3. Check if the uploaded data does not reset when back from query page", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{FilePicker1.files[0].name}}`,
      );
      cy.createAndFillApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
        "",
      );
      cy.updateCodeInput(
        "[class*='t--actionConfiguration']",
        "{{FilePicker1.files}}",
      );
      cy.wait(1000);
      cy.validateEvaluatedValue("testFile.mov");

      // Go back to widgets page
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(widgetsPage.filepickerwidgetv2).should(
        "contain",
        "1 files selected",
      );
      cy.get(".t--widget-textwidget").should("contain", "testFile.mov");
    });

    it("4. Check if the uploaded file is removed on click of cancel button", () => {
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(widgetsPage.filepickerwidgetv2CancelBtn).click();
      cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
      cy.get(widgetsPage.filepickerwidgetv2CloseModalBtn).click();
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      cy.get(".t--entity-item:contains(Api1)").click();
      cy.focusCodeInput("[class*='t--actionConfiguration']");
      cy.wait(1000);
      cy.validateEvaluatedValue("[]");
    });

    it("5. Check removed file", function () {
      // Go back to widgets page
      PageLeftPane.switchSegment(PagePaneSegment.UI);

      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", `{{FilePicker1.files}}`);

      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(widgetsPage.filepickerwidgetv2CloseModalBtn).click();

      // Set the maximum number of files allowed to be selected in the file picker.
      cy.get(commonlocators.filePickerMaxNoOfFiles).type("2");

      // Set the 'dataFormat' dropdown of our file picker to Base64.
      cy.selectDropdownValue(commonlocators.filePickerDataFormat, "Base64");

      // Upload a new file
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testRemoveFile1.json", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Upload a new file
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.AddMoreFiles).click();
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testRemoveFile2.json", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Check file data
      cy.get(".t--widget-textwidget").should(
        "contain",
        "data:application/json;base64",
      );

      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerRemoveButton).first().click();
      cy.get(widgetsPage.filepickerwidgetv2CloseModalBtn).click();

      // Check file data
      cy.get(".t--widget-textwidget").should(
        "contain",
        "data:application/json;base64",
      );
    });
  },
);
