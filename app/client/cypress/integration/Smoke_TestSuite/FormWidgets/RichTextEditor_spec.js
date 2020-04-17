const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

describe("RichTextEditor Widget Functionality", function() {
  it("RichTextEditor Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.richTextEditorWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.richTextEditorWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for RichTextEditor and also the properties of RichTextEditor widget
    cy.get(formWidgetsPage.richEditorOnTextChange)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate to URL")
      .click();
    cy.get(formWidgetsPage.richEditorOnTextChange)
      .get(commonlocators.dropdownSelectButton)
      .find("> span")
      .eq(0)
      .should("have.text", "Navigate to URL");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
