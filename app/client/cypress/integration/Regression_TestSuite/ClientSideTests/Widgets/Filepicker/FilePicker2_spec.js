const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("FilePicker Widget Functionality", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.addDsl(dsl);
  });

  it("1. Create API to be used in Filepicker", function () {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(
      this.data.paginationUrl,
      this.data.paginationParam,
    );
    cy.SaveAndRunAPI();
  });

  it("2. FilePicker Widget Functionality", function () {
    cy.SearchEntityandOpen("FilePicker1");
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    //Checking the edit props for FilePicker and also the properties of FilePicker widget
    cy.testCodeMirror("Upload Files");
  });

  it("3. It checks the loading state of filepicker on call the action", function () {
    cy.SearchEntityandOpen("FilePicker1");
    const fixturePath = "testFile.mov";
    cy.executeDbQuery("FirstAPI", "onFilesSelected");
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput).first().attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(".bp3-spinner").should("have.length", 1);
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  it("4. It checks the deletion of filepicker works as expected", function () {
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput).first().attachFile("testFile.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
    cy.get(commonlocators.filePickerButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get("button.uppy-Dashboard-Item-action--remove").click();
    cy.get("button.uppy-Dashboard-browse").click();
    cy.get(commonlocators.filePickerInput).first().attachFile("testFile2.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
