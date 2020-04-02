const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
  it("Checkbox Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.checkboxWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.checkboxWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Checkbox and also the properties of Checkbox widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .should("be.empty")
      .clear({ force: true })
      .type("Test Input Label");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Test Input Label");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
