const widgetsPage = require("../../locators/Widgets.json");
const loginPage = require("../../locators/LoginPage.json");
const loginData = require("../../fixtures/user.json");
const commonlocators = require("../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Table Widget Functionality", function() {
    cy.get(widgetsPage.tableWidget)
      .first()
      .trigger("mouseover", { force: true });
    cy.get(widgetsPage.tableWidget)
      .children(commonlocators.editicon)
      .first()
      .click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{meta}a")
      .clear({ force: true })
      .type("{{MockUsersApi.data}}", { parseSpecialCharSequences: false });
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
