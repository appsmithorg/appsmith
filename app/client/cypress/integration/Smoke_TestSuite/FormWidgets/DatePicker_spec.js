const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");

describe("DatePicker Widget Functionality", function() {
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
    cy.testCodeMirror("From Date");
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
