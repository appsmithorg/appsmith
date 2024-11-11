/// <reference types="Cypress" />

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import data from "../../../../../fixtures/TestDataSet1.json";

import {
  PROPERTY_SELECTOR,
  getWidgetSelector,
} from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "MultiSelect Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("multiSelectDsl");
    });

    it("1. Selects value with invalid default value", () => {
      cy.openPropertyPane("multiselectwidgetv2");
      _.propPane.ToggleJSMode("sourcedata");
      _.propPane.UpdatePropertyFieldValue(
        "Source Data",
        JSON.stringify(data.input),
      );

      _.propPane.ToggleJSMode("labelkey");
      cy.updateCodeInput(
        ".t--property-control-wrapper.t--property-control-labelkey",
        `label`,
      );

      _.propPane.ToggleJSMode("valuekey");
      cy.updateCodeInput(".t--property-control-valuekey", `value`);

      _.propPane.UpdatePropertyFieldValue(
        "Default selected values",
        "{{ undefined }}",
      );
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });

      cy.dropdownMultiSelectDynamic("Option 3");

      cy.wait(2000);
      //Validating option inside multiselect widget
      cy.get(".rc-select-selection-item-content")
        .first()
        .should("have.text", "Option 3");
    });

    it("2. Selects value with enter in default value", () => {
      cy.testJsontext(
        "defaultselectedvalues",
        '[\n  {\n    "label": "Option 3",\n    "value": "3"\n  }\n]',
      );

      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-item-content")
        .first()
        .should("have.text", "Option 3");
    });

    it("3. Clears the search field when widget is closed and serverSideFiltering is off", () => {
      // Turn on the filterable for the widget
      _.agHelper.CheckUncheck(commonlocators.allowsearchingInputTypeCheckbox);
      // open the widget
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      // Search for Option 2 in the search input
      cy.get(".rc-select-dropdown input[type='text']").click().type("Option 2");
      // Select Option 2
      cy.get(".multi-select-dropdown")
        .contains("Option 2")
        .click({ force: true });
      // Assert Option 2 is selected
      cy.get(".rc-select-selection-item[title='Option 2']").should(
        "have.text",
        "Option 2",
      );
      // Close the widget
      cy.openPropertyPane("multiselectwidgetv2");
      // Reopen the widget
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      // Assert if the search input is empty
      cy.get(".rc-select-dropdown input[type='text']")
        .invoke("val")
        .should("be.empty");
    });

    it("4. Does not clear the search field when widget is closed and serverSideFiltering is on", () => {
      // Turn on server side filtering for the widget
      _.agHelper.CheckUncheck(widgetsPage.serversideFilteringInput);
      // open the widget
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      // Search for Option 2 in the search input
      cy.get(".rc-select-dropdown input[type='text']").click().type("Option 2");
      // Click on Option 2
      cy.get(".multi-select-dropdown")
        .contains("Option 2")
        .click({ force: true });
      // Close the widget
      cy.openPropertyPane("multiselectwidgetv2");
      // Reopen the widget
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      // Assert if the search input is not empty
      cy.get(".rc-select-dropdown input[type='text']")
        .invoke("val")
        .should("not.be.empty");
      // Turn off the filterable property for the widget
      _.agHelper.CheckUncheck(
        commonlocators.allowsearchingInputTypeCheckbox,
        false,
      );
      // Turn off server side filtering for the widget
      _.agHelper.CheckUncheck(widgetsPage.serversideFilteringInput, false);
    });

    it("5. Dropdown Functionality To Validate Options", function () {
      cy.get(".rc-select-selector").last().click({ force: true });
      cy.dropdownMultiSelectDynamic("Option 2");
      // Dropdown Functionality To Check Allow select all option
      // select all option is not enable
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-item-content")
        .first()
        .should("not.have.text", "Select all");
      // enable select all option from property pane
      cy.openPropertyPane("multiselectwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.allowSelectAllCheckbox);

      // press select all option
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });

      cy.dropdownMultiSelectDynamic("Select all");

      cy.wait(3000);
      //Validating option inside multiselect widget
      cy.get(".rc-select-selection-item-content")
        .eq(0)
        .should("have.text", "Option 1");
      cy.get(".rc-select-selection-item-content")
        .eq(1)
        .should("have.text", "Option 2");
    });

    it("6. Check isDirty meta property", function () {
      cy.openPropertyPane(_.draggableWidgets.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, `{{MultiSelect2.isDirty}}`);
      // Init isDirty by changing defaultOptionValue
      cy.openPropertyPane("multiselectwidgetv2");
      cy.updateCodeInput(
        PROPERTY_SELECTOR.defaultValue,
        '[\n  {\n    "label": "Option 1",\n    "value": "1"\n  }\n]',
      );
      cy.get(getWidgetSelector(_.draggableWidgets.TEXT))
        .eq(0)
        .should("contain", "false");
      // Interact with UI
      cy.get(".rc-select-selector").last().click({ force: true });
      cy.dropdownMultiSelectDynamic("Option 2");
      // Check if isDirty is set to true
      cy.get(getWidgetSelector(_.draggableWidgets.TEXT))
        .eq(0)
        .should("contain", "true");
      // Reset isDirty by changing defaultOptionValue
      cy.updateCodeInput(
        PROPERTY_SELECTOR.defaultValue,
        '[\n  {\n    "label": "Option 2",\n    "value": "2"\n  }\n]',
      );
      // Check if isDirty is set to false
      cy.get(getWidgetSelector(_.draggableWidgets.TEXT))
        .eq(0)
        .should("contain", "false");
    });

    const resetTestCases = [
      {
        options: [
          { label: "RED", value: "RED" },
          { label: "GREEN", value: "GREEN" },
          { label: "YELLOW", value: "YELLOW" },
        ],
        defaultValue: [{ label: "RED", value: "RED" }],
        optionsToSelect: ["GREEN", "YELLOW"],
        optionsToDeselect: ["RED"],
      },
      {
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
        defaultValue: ["1", "2", "3", "4"],
        optionsToSelect: [],
        optionsToDeselect: ["1"],
      },
      {
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
        defaultValue: [],
        optionsToSelect: [],
        optionsToDeselect: [],
      },
      {
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
        defaultValue: [{ label: "4", value: "4" }],
        optionsToSelect: [],
        optionsToDeselect: [],
      },
    ];

    it("6. Verify MultiSelect resets to default value", function () {
      resetTestCases.forEach((testCase) => {
        const { defaultValue, options, optionsToDeselect, optionsToSelect } =
          testCase;

        cy.openPropertyPane("multiselectwidgetv2");
        // set options
        _.propPane.UpdatePropertyFieldValue(
          "Source Data",
          JSON.stringify(options),
        );
        _.agHelper.PressEscape();
        // set default value
        _.propPane.UpdatePropertyFieldValue(
          "Default selected values",
          JSON.stringify(defaultValue, null, 2),
          true,
          false,
        );
        // select other options
        _.agHelper.SelectFromMultiSelect(optionsToSelect);
        _.agHelper.RemoveMultiSelectItems(optionsToDeselect);

        // reset multiselect
        cy.get(
          `${getWidgetSelector("buttonwidget")}:contains('Reset MultiSelect')`,
        ).click();

        // verify value is equal to default value
        const defaultValuesStringifiedArray = defaultValue
          .map((opt) => (opt?.value !== undefined ? opt.value : opt))
          .toString();
        cy.get(getWidgetSelector("textwidget"))
          .eq(1)
          .should("have.text", defaultValuesStringifiedArray);
      });
    });

    it("7. Verify MultiSelect deselection behavior", function () {
      cy.openPropertyPane("multiselectwidgetv2");
      // set options
      _.propPane.UpdatePropertyFieldValue(
        "Source Data",
        JSON.stringify([{ label: "RED", value: "RED" }]),
      );
      _.agHelper.PressEscape();
      _.propPane.UpdatePropertyFieldValue("Default selected values", '["RED"]');
      _.agHelper.RemoveMultiSelectItems(["RED"]);
      // verify value is equal to default value
      cy.get(getWidgetSelector("textwidget")).eq(1).should("have.text", "");
    });

    it("8. Dropdown Functionality To Unchecked Visible Widget", function () {
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
        "not.exist",
      );
      _.deployMode.NavigateBacktoEditor();
      // Dropdown Functionality To Check Visible Widget", function () {
      cy.openPropertyPane("multiselectwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
        "be.visible",
      );
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
