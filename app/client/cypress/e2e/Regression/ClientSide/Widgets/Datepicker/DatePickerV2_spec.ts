import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "DatePicker Widget Property pane tests with js bindings",
  { tags: ["@tag.Widget", "@tag.Datepicker", "@tag.Binding"] },
  function () {
    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    before(() => {
      _.agHelper.AddDsl("datePicker2dsl");
    });

    it("1. Datepicker default date validation with js binding", function () {
      cy.openPropertyPane("datepickerwidget2");
      cy.get(
        ".t--property-control-defaultdate .ads-v2-input__input-section-input",
      ).clear();
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
      _.deployMode.DeployApp();
      cy.get(publishPage.datepickerWidget + " .bp3-input").should(
        "contain.value",
        "14/02/2021",
      );
      */
    });

    it("2. Text widgets binding with datepicker", function () {
      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{DatePicker1.formattedDate}}");
      cy.closePropertyPane();
      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);

      cy.EnableAllCodeEditors();
      cy.testJsontext("text", "{{DatePicker1.selectedDate}}");
      cy.closePropertyPane();
    });

    it("3. Text widgets binding with datepicker", function () {
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

    it("4. Datepicker default date validation message", function () {
      cy.openPropertyPane("datepickerwidget2");
      cy.testJsontext("defaultdate", "24-12-2021");
      cy.evaluateErrorMessage("Value does not match: ISO 8601 date string");
      cy.closePropertyPane();
    });

    it("5. Datepicker input value changes to work with selected date formats", function () {
      _.agHelper.AddDsl("datePickerdsl");

      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      _.propPane.EnterJSContext("Min Date", "2021-01-01");
      _.propPane.EnterJSContext("Max Date", "2021-10-10");
      cy.selectDateFormat("DD/MM/YYYY HH:mm");
      _.propPane.EnterJSContext(
        "Default Date",
        `{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}`,
      );
      cy.get(".t--draggable-datepickerwidget2 .bp3-input")
        .clear({
          force: true,
        })
        .type("04/05/2021 06:25")
        .wait(2000);
      cy.selectDateFormat("LLL");
      cy.get(".t--draggable-textwidget .bp3-ui-text")
        .first()
        .should("contain.text", "May 4, 2021 6:25 AM");

      _.propPane.UpdatePropertyFieldValue("Default Date", "2020-02-01");

      _.agHelper.AssertPopoverTooltip("Date out of range");
    });

    it("6. Check isDirty meta property", function () {
      _.agHelper.AddDsl("datePickerdsl");
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{DatePicker1.isDirty}}`,
      );
      // Init isDirty
      cy.openPropertyPane("datepickerwidget2");
      cy.testJsontextclear("defaultdate");
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.get(
        ".t--property-control-defaultdate .ads-v2-input__input-section-input",
      ).clear();
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.testJsontext(
        "defaultdate",
        '{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
      );
      cy.closePropertyPane();
      // Check if initial value of isDirty is false
      cy.get(".t--widget-textwidget").first().should("contain", "false");
      // Interact with UI
      cy.get(".t--draggable-datepickerwidget2 .bp3-input")
        .clear({
          force: true,
        })
        .type("04/05/2021 06:25");
      cy.wait("@updateLayout");
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").first().should("contain", "true");
      // Change defaultDate
      cy.openPropertyPane("datepickerwidget2");
      cy.testJsontext("defaultdate", "");
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.get(
        ".t--property-control-defaultdate .ads-v2-input__input-section-input",
      ).clear();
      cy.get(formWidgetsPage.toggleJsDefaultDate).click();
      cy.testJsontext(
        "defaultdate",
        '{{moment("07/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
      );
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").first().should("contain", "false");
    });

    it("7. Datepicker default date validation with js binding", function () {
      _.deployMode.DeployApp(); // eslint-disable-next-line cypress/no-unnecessary-waiting
      _.deployMode.NavigateBacktoEditor();
    });

    it("8. Datepicker should not change the display data unless user selects the date", () => {
      _.agHelper.AddDsl("datePickerdsl");

      cy.openPropertyPane("datepickerwidget2");

      cy.testJsontext(
        "defaultdate",
        '{{moment("04/05/2021 05:25", "DD/MM/YYYY HH:mm").toISOString()}}',
      );
      _.agHelper.PressEscape();
      _.agHelper.GetNClick(formWidgetsPage.minDateTextArea, 0, true);
      cy.testJsontextclear("mindate");
      _.agHelper.GetNClick(formWidgetsPage.toggleJsMinDate, 0, true);
      _.agHelper.WaitUntilEleAppear(formWidgetsPage.minDateInput);
      _.agHelper.AssertAttribute(
        formWidgetsPage.minDateInput,
        "placeholder",
        "YYYY-MM-DD HH:mm",
        0,
      );
      _.agHelper.ClickNClear(formWidgetsPage.minDateInput, true, 0);
      cy.get(formWidgetsPage.minDateInput).type("2020-02-01");
      cy.selectDateFormat("D MMMM, YYYY");
      cy.get(formWidgetsPage.datePickerInput).should(
        "contain.value",
        "4 May, 2021",
      );
      cy.get(formWidgetsPage.datePickerInput).click({ force: true });
      cy.get(formWidgetsPage.dayPickerNextButton).click({ force: true });
      cy.get(formWidgetsPage.datePickerInput).should(
        "contain.value",
        "4 May, 2021",
      );
      cy.get(formWidgetsPage.toggleJsMinDate).click();
      cy.testJsontext(
        "mindate",
        "{{moment().subtract(10, 'days').toISOString()}}",
      );
    });
  },
);

describe(
  "DatePicker Widget Property tests onFocus and onBlur",
  { tags: ["@tag.Widget", "@tag.Datepicker"] },
  function () {
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
      _.agHelper.PressEscape();
      cy.validateToastMessage("Blurred");
    });
  },
);
