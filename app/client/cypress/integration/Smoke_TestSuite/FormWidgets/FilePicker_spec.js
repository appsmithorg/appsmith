const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("FilePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("FilePicker Widget Functionality", function() {
    cy.get(formWidgetsPage.filepickerWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.filepickerWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for FilePicker and also the properties of FilePicker widget

    cy.testCodeMirror("Upload Files");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
