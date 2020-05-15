const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/uibindingdsl.json");

describe("Binding the Datepicker and Text Widget", function() {
  let nextDay;
  let dateDp2;
  before(() => {
    cy.addDsl(dsl);
  });

  it("DatePicker1-text: Change the date in DatePicker1 and Validate the same in text widget", function() {
    cy.openPropertyPane("textwidget");

    /**
     * Bind the datepicker1 to text widget
     */
    cy.testJsontext("text", "{{DatePicker1.defaultDate}}");
    cy.get(commonlocators.editPropCrossButton).click();

    /**
     * Fetching the date on DatePicker2
     */

    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input")
      .eq(1)
      .invoke("val")
      .then(val => {
        dateDp2 = val;
        cy.log(dateDp2);
      });

    /**
     * Changing date on datepicker1 to current date +1
     */
    cy.openPropertyPane("datepickerwidget");
    cy.SetDateToToday();
    cy.get(formWidgetsPage.nextDayBtn).click();
    cy.get(commonlocators.onDateSelectedField).click();
    cy.get(commonlocators.editPropCrossButton).click();

    /**
     *Validate the date in text widget
     */

    nextDay = Cypress.moment()
      .add(1, "days")
      .format("YYYY-MM-DD");
    cy.get(commonlocators.labelTextStyle).should("contain", nextDay);
  });

  it("Validate the Date is not changed in DatePicker2", function() {
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input")
      .eq(1)
      .should("have.value", dateDp2);
  });
});
