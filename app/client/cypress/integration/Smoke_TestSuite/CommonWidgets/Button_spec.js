const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Button Widget Functionality", function() {
    cy.NavigateToCommonWidgets();
    cy.get(".t--nav-link-widgets-editor").click();
    cy.get(widgetsPage.buttonWidget).click({ force: true });
    //Checking the edit props for Button
    cy.get(".CodeMirror textarea")
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("Test Button Text");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Test Button Text");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
