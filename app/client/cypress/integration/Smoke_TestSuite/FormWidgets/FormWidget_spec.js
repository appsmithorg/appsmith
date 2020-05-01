const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Form Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Form Widget Functionality", function() {
    cy.get(formWidgetsPage.formWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.formWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Form and also the properties of Form widget
    cy.testCodeMirror("Gray");

    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
