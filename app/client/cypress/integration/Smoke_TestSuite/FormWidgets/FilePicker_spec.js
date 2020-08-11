const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/newFormDsl.json");
const pages = require("../../../locators/Pages.json");

describe("FilePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("FilePicker Widget Functionality", function() {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("filepickerwidget");

    //Checking the edit props for FilePicker and also the properties of FilePicker widget

    cy.testCodeMirror("Upload Files");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
