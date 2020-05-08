const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Container Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Container Widget Functionality", function() {
    cy.openPropertyPane("containerwidget");

    //Checking the edit props for container changing the background color of container
    cy.testCodeMirror("#C0C0C0");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
