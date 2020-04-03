const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
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
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .should("be.empty")
      .clear({ force: true })
      .type("Gray");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Gray");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
