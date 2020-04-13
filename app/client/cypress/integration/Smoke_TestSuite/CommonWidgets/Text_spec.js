const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

context("Cypress test", function() {
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
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("Test text", { force: true })
      .wait(5000);

    // TODO instead of testing the textarea, test the actual widget
    // cy.get(".CodeMirror textarea")
    //   .first()
    //   .should("have.value", "Test text");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
