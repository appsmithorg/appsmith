const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");

context("Cypress test", function() {
  it("Container Widget Functionality", function() {
    cy.NavigateToCommonWidgets();
    cy.get(widgetsPage.containerWidget)
      .first()
      .trigger("mouseover", { force: true });
    cy.get(widgetsPage.containerWidget)
      .get(commonlocators.editIcon)
      .first()
      .click();
    //Checking the edit props for container changing the background color of container
    cy.get(".CodeMirror textarea")
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type("#C0C0C0", { force: true })
      .wait(5000);

    // TODO instead of testing the textarea, test the actual widget
    // cy.get(".CodeMirror textarea").should("have.value", "#C0C0C0");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
