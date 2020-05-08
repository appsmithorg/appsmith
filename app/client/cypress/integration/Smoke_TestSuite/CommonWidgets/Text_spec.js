const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Text Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Text Widget Functionality", function() {
    cy.openPropertyPane("textwidget");

    //Changing the text on the text widget
    cy.testCodeMirror("Test text");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
