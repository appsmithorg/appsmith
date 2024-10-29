const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dayjs = require("dayjs");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "DatePicker Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Datepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");
    });

    beforeEach(() => {
      cy.openPropertyPane("datepickerwidget");
    });

    // ADS changes to date input property causes this test to fail
    // skipping it temporarily.
    it("DatePicker-Date Name validation", function () {
      // changing the date to today
      cy.get(formWidgetsPage.defaultDate).click();
      cy.get(formWidgetsPage.dayPickerToday).click();

      //changing the Button Name
      cy.widgetText(
        this.dataSet.Datepickername,
        formWidgetsPage.datepickerWidget,
        widgetsPage.widgetNameSpan,
      );

      // change the date to next day
      cy.get(formWidgetsPage.defaultDate).click();

      /**
       * setDate--> is a Command to select the date in the date picker
       */
      cy.setDate(1);
      const nextDay = dayjs().add(1, "days").format("DD/MM/YYYY");
      cy.log(nextDay);
      cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        nextDay,
      );
      _.deployMode.DeployApp();
      cy.get(publishPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        nextDay,
      );
    });

    it("1. Datepicker-Clear date validation", function () {
      const today = dayjs().add(0, "days").format("DD/MM/YYYY");
      cy.get(formWidgetsPage.defaultDate).click();
      cy.ClearDate();
      _.deployMode.DeployApp();
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

    //   _.deployMode.DeployApp();
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

    //   _.deployMode.DeployApp();
    // });

    // it("DatePicker-check Required field validation", function() {
    //   // Check the required checkbox
    //   cy.CheckWidgetProperties(commonlocators.requiredCheckbox);
    //   cy.get(formWidgetsPage.datepickerWidget + " .bp3-label").should(
    //     "contain.text",
    //     "From Date",
    //   );
    //   _.deployMode.DeployApp();
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
    //   _.deployMode.DeployApp();
    //   cy.get(publishPage.datepickerWidget + " .bp3-label").should(
    //     "contain.text",
    //     "From Date",
    //   );
    // });

    it("2. DatePicker-check Visible field  validation", function () {
      // Check the visible checkbox
      cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.datepickerWidget).should("not.exist");
    });

    it("3. DatePicker-uncheck Visible field validation", function () {
      // Check the visible checkbox
      cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.datepickerWidget).should("be.visible");
    });

    it("4. DatePicker-Disable field validation", function () {
      //Check the Disabled checkbox
      cy.CheckWidgetProperties(commonlocators.disableCheckbox);
      cy.validateDisableWidget(
        formWidgetsPage.datepickerWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateDisableWidget(
        publishPage.datepickerWidget,
        commonlocators.disabledField,
      );
    });

    it("5. DatePicker-Enable field validation", function () {
      //UnCheck the Disabled checkbox
      cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
      cy.validateEnableWidget(
        formWidgetsPage.datepickerWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateEnableWidget(
        publishPage.datepickerWidget,
        commonlocators.disabledField,
      );
    });

    afterEach(() => {
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
