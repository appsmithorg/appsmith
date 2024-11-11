import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "DatePicker Widget Property pane tests with js bindings",
  { tags: ["@tag.Widget", "@tag.Datepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("datePicker2dsl");
    });

    it("1. Datepicker default date validation with js binding and default date", function () {
      cy.openPropertyPane("datepickerwidget2");
      cy.get(".t--property-control-defaultdate input").clear();
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.EnableAllCodeEditors();
      cy.testJsontext(
        "defaultdate",
        "{{ moment().add(-1,'days').toISOString() }}",
      );
    });

    it("2. Datepicker default time picker validation by Time precision", function () {
      // default value in property pane
      cy.openPropertyPane("datepickerwidget2");
      cy.get(
        ".t--property-control-timeprecision .rc-select-selection-item",
      ).should("have.text", "Minute");

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

    it("3. Hide Time picker from Datepicker", function () {
      // default value in property pane
      cy.openPropertyPane("datepickerwidget2");
      cy.get(".t--property-control-timeprecision .rc-select-selection-item")
        .last()
        .click({ force: true });
      cy.get(".t--dropdown-option").children().contains("None").click();
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

    it("4. set second field in time picker for Datepicker", function () {
      // default value in property pane
      cy.openPropertyPane("datepickerwidget2");

      cy.get(".t--property-control-timeprecision .rc-select-selection-item")
        .last()
        .click({ force: true });
      cy.get(".t--dropdown-option").children().contains("Second").click();
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

    it("5. Text widgets binding with datepicker", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      cy.EnableAllCodeEditors();
      cy.testJsontext("text", "{{DatePicker1.formattedDate}}");
      cy.closePropertyPane();
      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);

      cy.EnableAllCodeEditors();
      cy.testJsontext("text", "{{DatePicker1.selectedDate}}");
      cy.closePropertyPane();
    });

    it("6. Text widgets binding with datepicker", function () {
      cy.openPropertyPane("datepickerwidget2");
      cy.selectDateFormat("DD/MM/YYYY");
      cy.assertDateFormat();
      cy.closePropertyPane();
      cy.assertDateFormat();
    });

    it("7. Datepicker default date validation with js binding and default date with moment object", function () {
      cy.openPropertyPane("datepickerwidget2");
      //cy.testJsontext("defaultdate", "");
      cy.clearPropertyValue(0);
      cy.get(formWidgetsPage.toggleJsDefaultDate).click().wait(1000); //disable
      cy.get(formWidgetsPage.toggleJsDefaultDate).click(); //enable
      cy.EnableAllCodeEditors();
      cy.testJsontext("defaultdate", `{{moment("1/1/2012")}}`);
      cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
        "contain.value",
        "01/01/2012 00:00",
      );
    });

    it("8. Datepicker clear date, validation with js binding and default date with moment object", function () {
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

    // it("9. Datepicker default date validation with js binding", function () {
    //   _.deployMode.DeployApp();
    //   // eslint-disable-next-line cypress/no-unnecessary-waiting
    // });
  },
);
