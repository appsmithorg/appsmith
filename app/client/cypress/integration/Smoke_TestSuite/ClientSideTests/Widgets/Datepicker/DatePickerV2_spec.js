const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/datePicker2dsl.json");
const datedsl = require("../../../../../fixtures/datePickerdsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;

describe("DatePicker Widget Property pane tests with js bindings", function() {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Datepicker default date validation with js binding", function() {
    cy.wait(7000);
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext("defaultdate", "{{moment().toISOString()}}");
    cy.get(formWidgetsPage.toggleJsMinDate).click();
    cy.testJsontext(
      "mindate",
      "{{moment().subtract(10, 'days').toISOString()}}",
    );
    cy.get(formWidgetsPage.toggleJsMaxDate).click();
    cy.testJsontext("maxdate", "{{moment().add(10, 'days').toISOString()}}");
    /*
      cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        "14/02/2021",
      );
      cy.PublishtheApp();
      cy.get(publishPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        "14/02/2021",
      );
      */
  });

  it("2. Text widgets binding with datepicker", function() {
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{DatePicker1.formattedDate}}");
    cy.closePropertyPane();
    cy.SearchEntityandOpen("Text2");
    cy.EnableAllCodeEditors();
    cy.testJsontext("text", "{{DatePicker1.selectedDate}}");
    cy.closePropertyPane();
  });

  it("3. Text widgets binding with datepicker", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.selectDateFormat("YYYY-MM-DD");
    cy.assertDateFormat();
    cy.selectDateFormat("YYYY-MM-DD HH:mm");
    cy.assertDateFormat();
    cy.selectDateFormat("ISO 8601");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY HH:mm");
    cy.closePropertyPane();
    cy.assertDateFormat();
  });

  it("4. Datepicker default date validation message", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.testJsontext("defaultdate", "24-12-2021");
    cy.evaluateErrorMessage("Value does not match: ISO 8601 date string");
    cy.closePropertyPane();
  });

  it("5. Datepicker should not change the display data unless user selects the date", () => {
    cy.addDsl(datedsl);

    cy.openPropertyPane("datepickerwidget2");

    cy.testJsontext(
      "defaultdate",
      '{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
    );
    cy.get(formWidgetsPage.toggleJsMinDate).click();
    cy.get(".t--property-control-mindate .bp3-input").clear();
    cy.get(".t--property-control-mindate .bp3-input").type("2020-02-01");
    cy.selectDateFormat("D MMMM, YYYY");
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "contain.value",
      "4 May, 2021",
    );
    cy.get(".t--widget-datepickerwidget2 .bp3-input").click({ force: true });
    cy.get(".DayPicker-NavButton--next").click({ force: true });
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "contain.value",
      "4 May, 2021",
    );
    cy.get(formWidgetsPage.toggleJsMinDate).click();
    cy.testJsontext(
      "mindate",
      "{{moment().subtract(10, 'days').toISOString()}}",
    );
  });

  it("6. Datepicker default date validation with strings", function() {
    cy.addDsl(datedsl);
    cy.openPropertyPane("datepickerwidget2");
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(".t--property-control-defaultdate .bp3-input").type("2020-02-01");
    cy.closePropertyPane();
    cy.openPropertyPane("datepickerwidget2");
    cy.get(formWidgetsPage.toggleJsMinDate).click({ force: true });
    cy.get(".t--property-control-mindate .bp3-input").type("2020-01-01");
    cy.get(formWidgetsPage.toggleJsMaxDate).click({ force: true });
    cy.get(".t--property-control-maxdate .bp3-input").type("2020-02-10");
    cy.closePropertyPane();
  });

  it("7. Datepicker input value changes to work with selected date formats", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-mindate .bp3-input")
      .clear()
      .type("2021-01-01");
    cy.closePropertyPane();
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-maxdate .bp3-input")
      .clear()
      .type("2021-10-10");
    cy.closePropertyPane();
    cy.openPropertyPane("datepickerwidget2");
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.selectDateFormat("DD/MM/YYYY HH:mm");
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext(
      "defaultdate",
      '{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
    );
    cy.get(".t--draggable-datepickerwidget2 .bp3-input")
      .clear({
        force: true,
      })
      .type("04/05/2021 06:25");
    cy.selectDateFormat("LLL");
    cy.wait("@updateLayout");
    cy.get(".t--draggable-textwidget .bp3-ui-text")
      .first()
      .should("contain.text", "May 4, 2021 6:25 AM");
  });

  it("8. Check isDirty meta property", function() {
    cy.addDsl(datedsl);
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{DatePicker1.isDirty}}`);
    // Init isDirty
    cy.openPropertyPane("datepickerwidget2");
    cy.testJsontextclear("defaultdate");
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext(
      "defaultdate",
      '{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
    );
    cy.closePropertyPane();
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget")
      .first()
      .should("contain", "false");
    // Interact with UI
    cy.get(".t--draggable-datepickerwidget2 .bp3-input")
      .clear({
        force: true,
      })
      .type("04/05/2021 06:25");
    cy.wait("@updateLayout");
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget")
      .first()
      .should("contain", "true");
    // Change defaultDate
    cy.openPropertyPane("datepickerwidget2");
    cy.testJsontext("defaultdate", "");
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext(
      "defaultdate",
      '{{moment("07/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
    );
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget")
      .first()
      .should("contain", "false");
  });

  it("9. Datepicker default date validation with js binding", function() {
    cy.PublishtheApp();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});

describe("DatePicker Widget Property tests onFocus and onBlur", function() {
  it("onBlur and onFocus should be triggered from the datePicker widget", () => {
    cy.Createpage("New Page");
    cy.dragAndDropToCanvas("datepickerwidget2", { x: 300, y: 600 });
    cy.openPropertyPane("datepickerwidget2");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext("onfocus", "{{showAlert('Focused','success')}}");
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext("onblur", "{{showAlert('Blurred','success')}}");

    cy.get(widgetsPage.datepickerInput).click({ force: true });
    cy.validateToastMessage("Focused");
    agHelper.PressEscape();
    cy.validateToastMessage("Blurred");
  });
});
