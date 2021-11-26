const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/datePicker2dsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

describe("DatePicker Widget Property pane tests with js bindings", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Datepicker default date validation with js binding and default date", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext(
      "defaultdate",
      "{{ moment().add(-1,'days').toISOString() }}",
    );
  });

  it("Datepicker default time picker validation by Time precision", function() {
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

  it("Hide Time picker from Datepicker", function() {
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

  it("set second field in time picker for Datepicker", function() {
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

  it("Text widgets binding with datepicker", function() {
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{DatePicker1.formattedDate}}");
    cy.closePropertyPane();
    cy.SearchEntityandOpen("Text2");
    cy.testJsontext("text", "{{DatePicker1.selectedDate}}");
    cy.closePropertyPane();
  });

  it("Text widgets binding with datepicker", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.selectDateFormat("DD/MM/YYYY");
    cy.assertDateFormat();
    cy.closePropertyPane();
    cy.assertDateFormat();
  });
  it("Datepicker default date validation with js binding", function() {
    cy.PublishtheApp();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);
  });
});
