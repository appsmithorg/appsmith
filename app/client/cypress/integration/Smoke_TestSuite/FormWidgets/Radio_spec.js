const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
  it("Radio Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.radioWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.radioWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Radio Widget and also the properties of Radio widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("Test Radio");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Test Radio");
    cy.xpath(formWidgetsPage.radioOnSelectionChangeDropdown)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .eq(3)
      .click();
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
