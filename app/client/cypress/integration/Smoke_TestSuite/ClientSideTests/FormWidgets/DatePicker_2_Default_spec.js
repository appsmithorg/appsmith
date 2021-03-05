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
    cy.testJsontext("defaultdate", "{{ moment().add(-1,'days') }}");
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
