const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
  it("Dropdown Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.dropdownWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.dropdownWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Checkbox and also the properties of Checkbox widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("Test Dropdown");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Test Dropdown");
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find("> div")
      .eq(1)
      .find("> span > span > div > button")
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .eq(1)
      .click();
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find("> div")
      .eq(1)
      .find("> span > span > div > button > span")
      .eq(0)
      .should("have.text", "Multi Select");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
