const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/uiBindDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

describe("Binding the Datepicker and Text Widget", function() {
  let nextDay;
  let dateDp2;

  before(() => {
    cy.addDsl(dsl);
  });

  it("DatePicker-Text, Validate selectedDate functionality", function() {
    /**
     * Bind DatePicker1 to Text for "selectedDate"
     */
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{DatePicker1.selectedDate}}");

    /**
     * Set the Calender for today's date in DatePicker1
     */
    cy.openPropertyPane("datepickerwidget");
    cy.get(formWidgetsPage.defaultDate).click();
    cy.ClearDateFooter();
    cy.SetDateToToday();

    cy.getDate(1, "YYYY-MM-DD").then((date) => {
      cy.log("retured date" + date);
      nextDay = date;
      cy.wait("@updateLayout");
      cy.wait("@updateLayout");

      cy.PublishtheApp();

      /**
       * Change the date in DatePicker1 in Publish mode and validate the same in Text Widget
       */
      cy.get(publishPage.datepickerWidget + commonlocators.inputField)
        .eq(0)
        .click();
      cy.ClearDateFooter();
      cy.setDate(1, "ddd MMM DD YYYY");
      cy.get(commonlocators.labelTextStyle).should("contain", nextDay);
    });

    cy.get(commonlocators.backToEditor).click();
  });

  it("DatePicker1-text: Change the date in DatePicker1 and Validate the same in text widget", function() {
    cy.openPropertyPane("textwidget");

    /**
     * Bind the datepicker1 to text widget
     */
    cy.testJsontext("text", "{{DatePicker1.defaultDate}}");

    /**
     * Fetching the date on DatePicker2
     */
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input")
      .eq(1)
      .invoke("val")
      .then((val) => {
        dateDp2 = val;
        cy.log(dateDp2);
      });

    /**
     * Changing date on datepicker1 to current date +1
     */
    cy.openPropertyPane("datepickerwidget");
    cy.get(formWidgetsPage.defaultDate).click();
    cy.ClearDateFooter();
    cy.setDate(1, "ddd MMM DD YYYY");
    cy.get(commonlocators.onDateSelectedField).click();

    /**
     *Validate the date in text widget
     */
    cy.getDate(1, "YYYY-MM-DD").then((date) => {
      cy.log("retured date" + date);
      nextDay = date;
      cy.get(commonlocators.labelTextStyle).should("contain", nextDay);
    });
  });

  it("Validate the Date is not changed in DatePicker2", function() {
    cy.log("dateDp2:" + dateDp2);
    cy.get(formWidgetsPage.datepickerWidget + commonlocators.inputField)
      .eq(1)
      .should("have.value", dateDp2);

    cy.PublishtheApp();
    cy.get(commonlocators.labelTextStyle).should("contain", nextDay);
    cy.get(publishPage.datepickerWidget + commonlocators.inputField)
      .eq(1)
      .should("have.value", dateDp2);
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("DatePicker-Text, Validate Multiple Binding", function() {
    /**
     * Bind the DatePicker1 and DatePicker2 along with hard coded text to Text widget
     */
    cy.openPropertyPane("textwidget");
    cy.testJsontext(
      "text",
      "{{DatePicker1.isDisabled}} DatePicker {{DatePicker2.isDisabled}}",
    );
    cy.get(commonlocators.labelTextStyle).should("contain.text", "DatePicker");
    cy.PublishtheApp();
    cy.get(commonlocators.labelTextStyle).should("contain.text", "DatePicker");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Checks if on deselection of date triggers the onDateSelected action or not.", function() {
    /**
     * bind datepicker to show a message "Hello" on date selected
     */
    cy.openPropertyPane("datepickerwidget");
    cy.get(commonlocators.onDateSelectedField).click();
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Show message")
      .click({ force: true });
    cy.getAlert(commonlocators.optionchangetextDatePicker);

    /**
     * checking if on selecting the date triggers the message
     */
    cy.get(formWidgetsPage.datepickerWidget)
      .first()
      .click();
    cy.ClearDateFooter();
    cy.SetDateToToday();
    cy.get(commonlocators.toastmsg).contains("hello");

    /**
     * checking if on deselecting the date triggers the message or not.
     * It should not trigger any message on deselection
     */
    cy.get(formWidgetsPage.datepickerWidget)
      .first()
      .click();
    cy.get(formWidgetsPage.datepickerFooter)
      .contains("Clear")
      .click();
    cy.get(commonlocators.toastmsg).should("not.exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
