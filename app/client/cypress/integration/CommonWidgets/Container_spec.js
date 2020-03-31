const widgetsPage = require("../../locators/Widgets.json");
const loginPage = require("../../locators/LoginPage.json");
const loginData = require("../../fixtures/user.json");
const commonlocators = require("../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Container Widget Functionality", function() {
    cy.get(widgetsPage.containerWidget)
      .first()
      .trigger("mouseover", { force: true });
    cy.get(widgetsPage.containerWidget)
      .get(commonlocators.editIcon)
      .first()
      .click();
    //Checking the edit props for container and also the properties of container
    cy.get(".CodeMirror textarea")
      .focus()
      .type("{meta}a")
      .clear({ force: true })
      .type("#C0C0C0");
    cy.get(".CodeMirror textarea").should("have.value", "#C0C0C0");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
