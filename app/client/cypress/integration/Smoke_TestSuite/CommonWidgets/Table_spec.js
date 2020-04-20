const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("Table Widget Functionality", function() {
  it("Table Widget Functionality", function() {
    cy.NavigateToCommonWidgets();
    cy.get(widgetsPage.tableWidget)
      .first()
      .trigger("mouseover", { force: true });
    cy.get(widgetsPage.tableWidget)
      .children(commonlocators.editicon)
      .first()
      .click();
    //Checking the edit props for Table Widget and also the properties of Table widget

    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate To")
      .click();
    cy.wait("@updateLayout");
    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .find("> .bp3-button-text")
      .should("have.text", "Navigate To");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
