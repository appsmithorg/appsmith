const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/uibindingdsl.json");

describe("Binding the Datepicker and Text Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Bind the date picker in text widget", function() {
    cy.openPropertyPane("textwidget");

    //Changing the text on the text widget
    cy.testCodeMirror("{{DatePicker1.defaultDate}}");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  it("Change the date in datePicker1 and validate the same in text widget", function() {
    // changing the date to today
    cy.SetDateToToday();

    //Changing date on date picker1 to current date +1
    cy.get(".DayPicker-Day[aria-selected='true'] + div").click();
    cy.get(".t--property-control-ondateselected").click();
    cy.get(commonlocators.editPropCrossButton).click();

    //Validate the changes in text widget
    const nd = Cypress.moment()
      .add(1, "days")
      .format("YYYY-MM-DD");
    cy.get(commonlocators.labelTextStyle).should("contain", nd);
  });
});
