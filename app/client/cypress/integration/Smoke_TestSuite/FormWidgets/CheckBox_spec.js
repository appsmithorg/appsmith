const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Checkbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Checkbox Widget Functionality", function() {
    cy.get(formWidgetsPage.checkboxWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.checkboxWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Checkbox and also the properties of Checkbox widget
    cy.testCodeMirror("Test Checkbox");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
