const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

describe("Dropdown Widget Functionality", function() {
  it("Dropdown Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.dropdownWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.dropdownWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Dropdown and also the properties of Dropdown widget
    cy.testCodeMirror("Test Dropdown");

    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(".bp3-button")
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Multi Select")
      .click();
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(".bp3-button > .bp3-button-text")
      .should("have.text", "Multi Select");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
