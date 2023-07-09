const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("FilePicker Widget Functionality", function () {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
    _.agHelper.AddDsl("newFormDsl");
  });

  it("1. Create API to be used in Filepicker", function () {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(
      this.dataSet.paginationUrl,
      this.dataSet.paginationParam,
    );
    cy.SaveAndRunAPI();
  });

  it("2. FilePicker Widget Functionality", function () {
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.entityExplorer.SelectEntityByName("FilePicker1");
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    //Checking the edit props for FilePicker and also the properties of FilePicker widget
    cy.testCodeMirror("Upload Files");
  });

  it("3. It checks the loading state of filepicker on call the action", function () {
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.entityExplorer.SelectEntityByName("FilePicker1");
    const fixturePath = "cypress/fixtures/testFile.mov";
    cy.executeDbQuery("FirstAPI", "onFilesSelected");
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput).first().selectFile(fixturePath, {
      force: true,
    });
    cy.get(commonlocators.filePickerUploadButton).click();
    //cy.get(".ads-v2-spinner").should("have.length", 1);
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  it("4. It checks the deletion of filepicker works as expected", function () {
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/testFile.mov", {
        force: true,
      });
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
    cy.get(commonlocators.filePickerButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get("button.uppy-Dashboard-Item-action--remove").click();
    cy.get("button.uppy-Dashboard-browse").click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .selectFile("cypress/fixtures/testFile2.mov", {
        force: true,
      });
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
