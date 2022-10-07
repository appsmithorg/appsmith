const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");

describe("FilePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Create API to be used in Filepicker", function() {
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

  it("FilePicker Widget Functionality", function() {
    cy.SearchEntityandOpen("FilePicker1");
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    //Checking the edit props for FilePicker and also the properties of FilePicker widget
    cy.testCodeMirror("Upload Files");
  });

  it("It checks the loading state of filepicker on call the action", function() {
    cy.SearchEntityandOpen("FilePicker1");
    const fixturePath = "testFile.mov";
    cy.addAPIFromLightningMenu("FirstAPI");
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(".bp3-spinner").should("have.length", 1);
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  it("It checks the deletion of filepicker works as expected", function() {
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("testFile.mov");
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
      .attachFile("testFile2.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
