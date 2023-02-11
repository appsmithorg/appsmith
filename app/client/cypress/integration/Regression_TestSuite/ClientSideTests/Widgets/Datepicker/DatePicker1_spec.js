const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/datePicker2dsl.json");

describe("DatePicker Widget Property pane tests with js bindings", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Datepicker default date validation with js binding and default date", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.EnableAllCodeEditors();
    cy.testJsontext(
      "defaultdate",
      "{{ moment().add(-1,'days').toISOString() }}",
    );
  });

  it("2. Datepicker default time picker validation by Time precision", function() {
    // default value in property pane
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-timeprecision span[type='p1']").should(
      "have.text",
      "Minute",
    );

    // default in date picker
    cy.get(".t--widget-datepickerwidget2 input").click();
    cy.wait(200);
    // datepicker is open
    cy.get(".bp3-popover .bp3-datepicker").should("exist");
    // checking timepicker
    cy.get(".bp3-datepicker-timepicker-wrapper .bp3-timepicker-input-row")
      .children()
      .should("have.length", 3);
    cy.closePropertyPane();
  });

  it("3. Hide Time picker from Datepicker", function() {
    // default value in property pane
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-timeprecision .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("None")
      .click();
    cy.wait("@updateLayout");
    // default in date picker

    cy.get(".t--widget-datepickerwidget2 input").click();
    cy.wait(200);
    // datepicker is open
    cy.get(".bp3-popover .bp3-datepicker").should("exist");
    // checking timepicker not showing
    cy.get(
      ".bp3-datepicker-timepicker-wrapper .bp3-timepicker-input-row",
    ).should("not.exist");
    cy.closePropertyPane();
  });

  it("4. set second field in time picker for Datepicker", function() {
    // default value in property pane
    cy.openPropertyPane("datepickerwidget2");

    cy.get(".t--property-control-timeprecision .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("Second")
      .click();
    cy.wait("@updateLayout");
    // default in date picker

    cy.get(".t--widget-datepickerwidget2 input").click();
    cy.wait(200);
    // datepicker is open
    cy.get(".bp3-popover .bp3-datepicker").should("exist");
    // checking timepicker
    cy.get(".bp3-datepicker-timepicker-wrapper .bp3-timepicker-input-row")
      .children()
      .should("have.length", 5);
    cy.closePropertyPane();
  });

  it("5. Text widgets binding with datepicker", function() {
    cy.SearchEntityandOpen("Text1");
    cy.EnableAllCodeEditors();
    cy.testJsontext("text", "{{DatePicker1.formattedDate}}");
    cy.closePropertyPane();
    cy.SearchEntityandOpen("Text2");
    cy.EnableAllCodeEditors();
    cy.testJsontext("text", "{{DatePicker1.selectedDate}}");
    cy.closePropertyPane();
  });

  it("6. Text widgets binding with datepicker", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.selectDateFormat("DD/MM/YYYY");
    cy.assertDateFormat();
    cy.closePropertyPane();
    cy.assertDateFormat();
  });

  it("7. Datepicker default date validation with js binding and default date with moment object", function() {
    cy.openPropertyPane("datepickerwidget2");
    //cy.testJsontext("defaultdate", "");
    cy.clearPropertyValue(0);
    cy.get(formWidgetsPage.toggleJsDefaultDate)
      .click()
      .wait(1000); //disable
    cy.get(formWidgetsPage.toggleJsDefaultDate).click(); //enable
    cy.EnableAllCodeEditors();
    cy.testJsontext("defaultdate", `{{moment("1/1/2012")}}`);
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "contain.value",
      "01/01/2012 00:00",
    );
  });

  it("8. Datepicker clear date, validation with js binding and default date with moment object", function() {
    // clear data and check datepicker textbox is clear
    cy.clearPropertyValue(0);
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "contain.value",
      "",
    );
    // add new date value and check datepicker textbox have value
    cy.EnableAllCodeEditors();
    cy.testJsontext("defaultdate", `{{moment("1/1/2012")}}`);
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "contain.value",
      "01/01/2012 00:00",
    );
  });

  it("9. Datepicker default date validation with js binding", function() {
    cy.PublishtheApp();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);
  });
});
