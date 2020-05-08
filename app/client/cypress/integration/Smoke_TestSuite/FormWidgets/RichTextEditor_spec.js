const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("RichTextEditor Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("RichTextEditor Widget Functionality", function() {
    cy.openPropertyPane("richtexteditorwidget");

    //Checking the edit props for RichTextEditor and also the properties of RichTextEditor widget
    cy.get(formWidgetsPage.richEditorOnTextChange)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate To")
      .click();
    cy.get(formWidgetsPage.richEditorOnTextChange)
      .get(commonlocators.dropdownSelectButton)
      .find("> span")
      .eq(0)
      .should("have.text", "Navigate To");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
