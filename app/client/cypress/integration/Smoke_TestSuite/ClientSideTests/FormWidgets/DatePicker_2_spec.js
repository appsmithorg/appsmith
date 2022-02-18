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
    cy.selectDateFormat("ISO 8601");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY");
    cy.assertDateFormat();
    cy.selectDateFormat("DD/MM/YYYY HH:mm");
    cy.closePropertyPane();
    cy.assertDateFormat();
  });

  it("Datepicker default date validation message", function() {
    cy.openPropertyPane("datepickerwidget2");
    cy.testJsontext("defaultdate", "24-12-2021");
    cy.evaluateErrorMessage("Value does not match: ISO 8601 date string");
    cy.closePropertyPane();
  });

  it("Datepicker default date validation with strings", function() {
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

  it("Datepicker input value changes to work with selected date formats", function() {
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
      .should("have.text", "May 4, 2021 6:25 AM");
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "datepickerwidget2";
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label`;
      const containerSelector = `${widgetSelector} [data-testid="datepicker-container"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus()
        .type(labelText);
      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "row");
      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click();
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");
      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click();
      cy.wait(300);
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click();
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });

  it("Datepicker default date validation with js binding", function() {
    cy.PublishtheApp();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);
  });
});
