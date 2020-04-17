const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

describe("FilePicker Widget Functionality", function() {
  it("FilePicker Widget Functionality", function() {
    cy.NavigateToFormWidgets();
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
});
