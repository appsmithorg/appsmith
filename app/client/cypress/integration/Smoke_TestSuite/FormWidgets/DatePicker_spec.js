const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("DatePicker Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("datepickerwidget");
  });

  it("DatePicker-Date Name validation", function() {
    // changing the date to today
    cy.get(formWidgetsPage.defaultDate).click();
    cy.SetDateToToday();

    //changing the Button Name
    cy.widgetText(
      this.data.Datepickername,
      formWidgetsPage.datepickerWidget,
      formWidgetsPage.datepickerWidget + " pre",
    );

    // change the date to next day
    cy.get(formWidgetsPage.defaultDate).click();

    /**
     * setDate--> is a Command to select the date in the date picker
     * @param1 --> its takes currentday+ <future day> eg: 1
     * @param2 --> user date formate
     */
    cy.setDate(1, "ddd MMM DD YYYY");
    const nextDay = Cypress.moment()
      .add(1, "days")
      .format("DD/MM/YYYY");
    cy.log(nextDay);
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      nextDay,
    );

    cy.PublishtheApp();
    cy.get(publishPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      nextDay,
    );
  });

  it("Datepicker-Clear date validation", function() {
    const today = Cypress.moment()
      .add(0, "days")
      .format("DD/MM/YYYY");
    cy.get(formWidgetsPage.defaultDate).click();
    cy.ClearDate();
    cy.PublishtheApp();
    cy.get(publishPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      "",
    );
  });

  // it("DatePicker-check Required field validation", function() {
  //   // Check the required checkbox
  //   cy.CheckWidgetProperties(commonlocators.requiredCheckbox);
  //   cy.get(formWidgetsPage.datepickerWidget + " .bp3-label").should(
  //     "contain.text",
  //     "From Date",
  //   );
  //   cy.PublishtheApp();
  //   cy.get(publishPage.datepickerWidget + " .bp3-label").should(
  //     "contain.text",
  //     "From Date",
  //   );
  // });

  // it("DatePicker-uncheck Required field validation", function() {
  //   // Uncheck the required checkbox
  //   cy.UncheckWidgetProperties(commonlocators.requiredCheckbox);
  //   cy.get(formWidgetsPage.datepickerWidget + " .bp3-label").should(
  //     "contain.text",
  //     "From Date",
  //   );
  //   cy.PublishtheApp();
  //   cy.get(publishPage.datepickerWidget + " .bp3-label").should(
  //     "contain.text",
  //     "From Date",
  //   );
  // });

  it("DatePicker-check Visible field  validation", function() {
    // Check the visible checkbox
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.datepickerWidget).should("not.be.visible");
  });

  it("DatePicker-uncheck Visible field validation", function() {
    // Check the visible checkbox
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.datepickerWidget).should("be.visible");
  });

  it("DatePicker-Disable feild validation", function() {
    //Check the Disabled checkbox
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateDisableWidget(
      formWidgetsPage.datepickerWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.datepickerWidget,
      commonlocators.disabledField,
    );
  });

  it("DatePicker-Enable feild validation", function() {
    //UnCheck the Disabled checkbox
    cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateEnableWidget(
      formWidgetsPage.datepickerWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.datepickerWidget,
      commonlocators.disabledField,
    );
  });

  afterEach(() => {
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
