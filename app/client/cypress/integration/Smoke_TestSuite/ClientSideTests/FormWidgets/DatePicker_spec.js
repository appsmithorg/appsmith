const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");
const dayjs = require("dayjs");

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
      formWidgetsPage.datepickerWidget + " " + commonlocators.widgetNameTag,
    );

    // change the date to next day
    cy.get(formWidgetsPage.defaultDate).click();

    /**
     * setDate--> is a Command to select the date in the date picker
     * @param1 --> its takes currentday+ <future day> eg: 1
     * @param2 --> user date formate
     */
    cy.setDate(1, "ddd MMM DD YYYY");
    const nextDay = dayjs()
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
    const today = dayjs()
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

  // it("Datepicker min/max date validation", function() {
  //   cy.get(formWidgetsPage.defaultDate).click({ force: true });
  //   cy.SetDateToToday();

  //   cy.get(formWidgetsPage.minDate)
  //     .first()
  //     .click();
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(1000);
  //   cy.setDate(-1, "ddd MMM DD YYYY");

  //   cy.get(formWidgetsPage.maxDate)
  //     .first()
  //     .click();
  //   // eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(1000);
  //   cy.setDate(1, "ddd MMM DD YYYY");

  //   cy.PublishtheApp();
  //   cy.get(publishPage.datepickerWidget + " .bp3-input").click();

  //   const minDate = Cypress.moment()
  //     .add(2, "days")
  //     .format("ddd MMM DD YYYY");
  //   const maxDate = Cypress.moment()
  //     .add(2, "days")
  //     .format("ddd MMM DD YYYY");

  //   cy.get(`.DayPicker-Day[aria-label=\"${minDate}\"]`).should(
  //     "have.attr",
  //     "aria-disabled",
  //     "true",
  //   );
  //   cy.get(`.DayPicker-Day[aria-label=\"${maxDate}\"]`).should(
  //     "have.attr",
  //     "aria-disabled",
  //     "true",
  //   );
  // });

  // it("Datepicker default date validation", function() {
  //   cy.get(formWidgetsPage.defaultDate).click();
  //   cy.wait(1000);
  //   cy.setDate(-2, "ddd MMM DD YYYY");
  //   cy.get(formWidgetsPage.defaultDate).should(
  //     "have.css",
  //     "border",
  //     "1px solid rgb(206, 66, 87)",
  //   );

  //   cy.PublishtheApp();
  // });

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
  //
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
    cy.get(publishPage.datepickerWidget).should("not.exist");
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
