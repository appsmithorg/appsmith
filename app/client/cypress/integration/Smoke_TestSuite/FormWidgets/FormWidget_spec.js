const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

describe("Form Widget Functionality", function() {
  it("Form Widget Functionality", function() {
    cy.NavigateToFormWidgets();
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
});
