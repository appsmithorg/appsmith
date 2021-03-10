const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/datePicker2dsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

describe("DatePicker Widget Property pane tests with js bindings", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Datepicker default date validation with js binding", function() {
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
    cy.selectDateFormat("YYYY-MM-DD");
    cy.assertDateFormat();
    cy.selectDateFormat("YYYY-MM-DD HH:mm");
    cy.assertDateFormat();
    cy.selectDateFormat("YYYY-MM-DDTHH:mm:ss.sssZ");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY HH:mm");
    cy.closePropertyPane();
    cy.assertDateFormat();
  });

  it("Datepicker default date validation with strings", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(".t--property-control-defaultdate .bp3-input").type("2020-02-01");
    cy.closePropertyPane();
    cy.openPropertyPane("datepickerwidget2");
    cy.get(formWidgetsPage.toggleJsMinDate).click();
    cy.get(".t--property-control-mindate .bp3-input").type("2020-01-01");
    cy.get(formWidgetsPage.toggleJsMaxDate).click();
    cy.get(".t--property-control-maxdate .bp3-input").type("2020-02-10");
    cy.closePropertyPane();
  });

  it("Datepicker default date validation with js binding", function() {
    cy.PublishtheApp();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);
  });
});
