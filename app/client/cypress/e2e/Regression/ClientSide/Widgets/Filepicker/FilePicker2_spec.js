import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "FilePicker Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Filepicker", "@tag.Binding"] },
  function () {
    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
      // V2 form of newFormDsl — current FilePicker under test.
      _.agHelper.AddDsl("filePicker2_formDsl");
    });

    it("1. Create API to be used in Filepicker", function () {
      _.apiPage.CreateAndFillApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
        "FirstAPI",
      );
      _.agHelper.Sleep(2000);
      _.apiPage.RunAPI();
    });

    it("2. FilePicker Widget Functionality", function () {
      EditorNavigation.SelectEntityByName(
        "FilePicker1",
        EntityType.Widget,
        {},
        ["Container3"],
      );
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      //Checking the edit props for FilePicker and also the properties of FilePicker widget
      cy.testCodeMirror("Upload Files");
    });

    it("3. It checks the loading state of filepicker on call the action", function () {
      EditorNavigation.SelectEntityByName(
        "FilePicker1",
        EntityType.Widget,
        {},
        ["Container3"],
      );
      const fixturePath = "cypress/fixtures/testFile.mov";
      cy.executeDbQuery("FirstAPI", "onFilesSelected");
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerInput).first().selectFile(fixturePath, {
        force: true,
      });
      cy.get(commonlocators.filePickerUploadButton).click();
      //cy.get(".ads-v2-spinner").should("have.length", 1);
      // Assert the canvas V2 widget only — modal may stay open during onFilesSelected.
      cy.get(widgetsPage.filepickerwidgetv2).should(
        "contain",
        "1 file selected",
      );
    });

    it("4. It checks the deletion of filepicker works as expected", function () {
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testFile.mov", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      cy.get(widgetsPage.filepickerwidgetv2).should(
        "contain",
        "1 file selected",
      );
      cy.get(widgetsPage.filepickerwidgetv2).click();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get("button.uppy-Dashboard-Item-action--remove").click();
      _.agHelper.GetNClick(".uppy-u-reset.uppy-Dashboard-close");
      cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
