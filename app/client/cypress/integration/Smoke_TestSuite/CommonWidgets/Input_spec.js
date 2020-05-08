const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Input Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Input Widget Functionality", function() {
    cy.openPropertyPane("inputwidget");

    //Checking the edit props for container and changing the Input label name
    cy.testCodeMirror("Test Input Label");

    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
