const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/newFormDsl.json");
const pages = require("../../../locators/Pages.json");

describe("FilePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("FilePicker Widget Functionality", function() {
    cy.openPropertyPane("filepickerwidget");

    //Checking the edit props for FilePicker and also the properties of FilePicker widget

    cy.testCodeMirror("Upload Files");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  it("It checks the loading state of filepicker on call the action", function() {
    cy.openPropertyPane("filepickerwidget");
    const fixturePath = "example.json";
    cy.getAlert(commonlocators.filePickerOnFilesSelected);
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(".bp3-spinner").should("have.length", 1);
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
