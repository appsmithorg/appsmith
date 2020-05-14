const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("DatePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("DatePicker Widget Functionality", function() {
      
     // changing the date to today
    cy.SetDateToToday();

    //Checking the edit props for DatePicker and also the properties of DatePicker widget
    cy.testCodeMirror(this.data.DatepickerLable);

    // change the date to next day
    cy.get(".t--property-control-defaultdate input").click();
    cy.get(".DayPicker-Day[aria-selected='true'] + div").click();
    const nd = Cypress.moment()
      .add(1, "days")
      .format("DD/MM/YYYY");
    cy.log(nd);

    //Validating the Date
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      nd,
    );

    // Check the required checkbox
    cy.CheckWidgetProperties(commonlocators.requiredCheckbox);
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-label").should(
      "contain.text",
      "date *",
    );

    // UnCheck the required checkbox
    cy.UnCheckWidgetProperties(commonlocators.requiredCheckbox);
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-label").should(
      "contain.text",
      "date",
    );

    // Check the visible checkbox
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);

    //Check the Disabled checkbox
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.get(
      formWidgetsPage.datepickerWidget + " .bp3-input-group.bp3-disabled",
    ).should("exist");

    //UnCheck the Disabled checkbox
    cy.UnCheckWidgetProperties(commonlocators.disableCheckbox);
    cy.get(
      formWidgetsPage.datepickerWidget + " .bp3-input-group.bp3-disabled",
    ).should("not.exist");

    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
