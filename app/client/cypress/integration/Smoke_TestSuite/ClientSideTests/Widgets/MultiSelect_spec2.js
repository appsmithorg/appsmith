/// <reference types="Cypress" />

const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/multiSelectDsl.json");
import data from "../../../../fixtures/example.json";
import {
  PROPERTY_SELECTOR,
  WIDGET,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  jsEditor = ObjectsRegistry.JSEditor;

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Selects value with invalid default value", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.testJsontext("options", JSON.stringify(data.input));
    cy.testJsontext("defaultvalue", "{{ undefined }}");
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
      "defaultvalue",
      '[\n  {\n    "label": "Option 3",\n    "value": "3"\n  }\n]',
    );
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Option 3");
  });

  it("3. Dropdown Functionality To Validate Options", function() {
    cy.get(".rc-select-selector").click({ force: true });
    cy.dropdownMultiSelectDynamic("Option 2");
  });

  it("4. Dropdown Functionality To Check Allow select all option", function() {
    // select all option is not enable
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("not.have.text", "Select all");
    // enable select all option from property pane
    cy.openPropertyPane("multiselectwidgetv2");
    cy.togglebar(commonlocators.allowSelectAllCheckbox);

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

  it("5. Check isDirty meta property", function() {
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, `{{MultiSelect2.isDirty}}`);
    // Init isDirty by changing defaultOptionValue
    cy.openPropertyPane("multiselectwidgetv2");
    cy.updateCodeInput(
      PROPERTY_SELECTOR.defaultValue,
      '[\n  {\n    "label": "Option 1",\n    "value": "1"\n  }\n]',
    );
    cy.get(getWidgetSelector(WIDGET.TEXT))
      .eq(0)
      .should("contain", "false");
    // Interact with UI
    cy.get(".rc-select-selector").click({ force: true });
    cy.dropdownMultiSelectDynamic("Option 2");
    // Check if isDirty is set to true
    cy.get(getWidgetSelector(WIDGET.TEXT))
      .eq(0)
      .should("contain", "true");
    // Reset isDirty by changing defaultOptionValue
    cy.updateCodeInput(
      PROPERTY_SELECTOR.defaultValue,
      '[\n  {\n    "label": "Option 2",\n    "value": "2"\n  }\n]',
    );
    // Check if isDirty is set to false
    cy.get(getWidgetSelector(WIDGET.TEXT))
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
      ],
      defaultValue: [{ label: "4", value: "4" }],
      optionsToSelect: [],
      optionsToDeselect: [],
    },
  ];

  it("6. Verify MultiSelect resets to default value", function() {
    resetTestCases.forEach((testCase) => {
      const {
        defaultValue,
        options,
        optionsToDeselect,
        optionsToSelect,
      } = testCase;

      cy.openPropertyPane("multiselectwidgetv2");
      // set options
      jsEditor.EnterJSContext("Options", JSON.stringify(options));
      cy.get("body").type("{esc}");
      // set default value
      jsEditor.EnterJSContext(
        "Default Value",
        JSON.stringify(defaultValue, null, 2),
      );
      // select other options
      agHelper.SelectFromMultiSelect(optionsToSelect);
      agHelper.RemoveMultiSelectItems(optionsToDeselect);

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

  it("7. Verify MultiSelect deselection behavior", function() {
    cy.openPropertyPane("multiselectwidgetv2");
    // set options
    jsEditor.EnterJSContext(
      "Options",
      JSON.stringify([{ label: "RED", value: "RED" }]),
    );
    cy.get("body").type("{esc}");
    jsEditor.EnterJSContext("Default Value", '["RED"]');
    agHelper.RemoveMultiSelectItems(["RED"]);

    // verify value is equal to default value
    cy.get(getWidgetSelector("textwidget"))
      .eq(1)
      .should("have.text", "");
  });

  it("8. Dropdown Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
      "not.exist",
    );
    cy.get(publish.backToEditor).click();
  });

  it("9. Dropdown Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
      "be.visible",
    );
    cy.get(publish.backToEditor).click();
  });
});
