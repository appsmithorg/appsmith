const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
  it("FilePicker Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.filepickerWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.filepickerWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for FilePicker and also the properties of FilePicker widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .should("be.empty")
      .clear({ force: true })
      .type("Upload Files");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "Upload Files");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
