const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("DatePicker Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("DatePicker Widget Functionality", function() {
    cy.openPropertyPane("datepickerwidget");

    // changing the date to today
    cy.SetDateToToday();

    //changing the Button Name
    cy.widgetText(
      this.data.Datepickername,
      formWidgetsPage.datepickerWidget,
      formWidgetsPage.datepickerWidget + " pre",
    );

    //Checking the edit props for DatePicker and also the properties of DatePicker widget
    // cy.testCodeMirror(this.data.DatepickerLable);
    // cy.wait("@updateLayout");

    // change the date to next day
    cy.get(".t--property-control-defaultdate input").click();

    /**
     * setDate--> is a Command to select the date in the date picker
     * @param1 --> its takes currentday+ <future day> eg: 1
     * @param2 --> user date formate
     */
    cy.setDate(1, "ddd MMM DD YYYY");

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

    // UnCheck the required checkbox
    cy.UnCheckWidgetProperties(commonlocators.requiredCheckbox);

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
