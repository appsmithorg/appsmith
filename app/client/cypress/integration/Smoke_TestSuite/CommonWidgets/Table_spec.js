const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

context("Cypress test", function() {
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
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .should("be.empty")
      .clear({ force: true })
      .should("be.empty")
      .type("{{UsersApi.data}}", {
        parseSpecialCharSequences: false,
        force: true,
      })
      .wait(5000);

    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Navigate to URL")
      .click();
    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .find("> .bp3-button-text")
      .should("have.text", "Navigate to URL");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
