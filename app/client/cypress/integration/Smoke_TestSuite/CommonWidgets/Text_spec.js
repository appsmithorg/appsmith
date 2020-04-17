const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("Text Widget Functionality", function() {
  it("Text Widget Functionality", function() {
    cy.NavigateToCommonWidgets();
    cy.get(widgetsPage.textWidget)
      .first()
      .trigger("mouseover");
    cy.get(widgetsPage.textWidget)
      .get(commonlocators.editIcon)
      .first()
      .click();
    //Changing the text on the text widget
    cy.testCodeMirror("Test text");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
