const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Checkbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Checkbox Widget Functionality", function() {
    cy.openPropertyPane("checkboxwidget");

    //Checking the edit props for Checkbox and also the properties of Checkbox widget
    cy.testCodeMirror("Test Checkbox");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
