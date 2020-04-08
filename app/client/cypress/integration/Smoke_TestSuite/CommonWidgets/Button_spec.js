const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Button Widget Functionality", function() {
    cy.NavigateToCommonWidgets();
    cy.get(".t--nav-link-widgets-editor").click();
    cy.get(widgetsPage.buttonWidget).click({ force: true });

    //Changing the text on the Button
    cy.get(".CodeMirror textarea")
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("Test Button Text");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Test Button Text");

    //Select and verify the Show Modal from the onClick dropdown
    cy.get(widgetsPage.buttonOnClick)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Show Modal")
      .click();
    cy.get(widgetsPage.buttonOnClick)
      .get(commonlocators.dropdownSelectButton)
      .find(".bp3-button-text")
      .should("have.text", "Show Modal");
    //Verify Modal Widget
    cy.CreateModal();
  });
});
