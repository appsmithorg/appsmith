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
    const fixturePath = "testFile.mov";
    cy.addAPI();
    cy.enterDatasourceAndPath(
      this.data.paginationUrl,
      this.data.paginationParam,
    );
    cy.get(".t--store-as-datasource-menu").click();
    cy.get(".t--store-as-datasource").click();
    cy.saveDatasource();
    cy.contains(".datasource-highlight", this.data.paginationUrl);
    cy.SaveAndRunAPI();
    cy.SearchEntityandOpen("FilePicker1");
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(".bp3-spinner").should("have.length", 1);
    cy.wait(500);
    cy.get("button").contains("1 files selected");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
