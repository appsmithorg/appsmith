const widgetsPage = require("../../locators/Widgets.json");
const loginPage = require("../../locators/LoginPage.json");
const loginData = require("../../fixtures/user.json");
const commonlocators = require("../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Button Widget Functionality", function() {
    cy.get(widgetsPage.buttonWidget).click({ force: true });
    //Checking the edit props for Button
    cy.get(".CodeMirror textarea")
      .focus()
      .type("{meta}a")
      .clear({ force: true })
      .type("{{Text4.text}}", { parseSpecialCharSequences: false });
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
