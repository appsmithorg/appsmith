const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

context("Cypress test", function() {
  it("DatePicker Widget Functionality", function() {
    cy.NavigateToFormWidgets();
    cy.get(formWidgetsPage.datepickerWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.datepickerWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for DatePicker and also the properties of DatePicker widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .should("be.empty")
      .clear({ force: true })
      .type("From Date");
    cy.get(".CodeMirror textarea")
      .first()
      .should("have.value", "From Date");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
