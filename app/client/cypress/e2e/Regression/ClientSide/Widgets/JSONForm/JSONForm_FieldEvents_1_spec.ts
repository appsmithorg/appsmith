/**
 * Spec to test the events made available by each field type
 */
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  deployMode,
  propPane,
  entityExplorer,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe(
  "Radio Group Field",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Set radio group pre condition and show alert on optionChange", () => {
      const schema = {
        answer: "Y",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("answer");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
      // Enable JS mode for onSelectionChange
      propPane.EnterJSContext(
        "onSelectionChange",
        "{{showAlert(formData.answer)}}",
      );

      deployMode.DeployApp();

      cy.get(`${fieldPrefix}-answer`)
        .find("label")
        .contains("No")
        .click({ force: true });

      // Check for alert
      agHelper.ValidateToastMessage("N");
      deployMode.NavigateBacktoEditor();
    });

    it("2. Shows updated formData values in onOptionChange binding", () => {
      const schema = {
        colors: ["BLUE"],
      };
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
      // cy.closePropertyPane();
    });

    it("4. Shows updated formData values in onOptionChange binding", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("colors");

      // Enable JS mode for onOptionChange
      propPane.EnterJSContext(
        "onOptionChange",
        "{{showAlert(formData.colors.join(', '))}}",
      );

      deployMode.DeployApp();
      // Click on multiselect field
      cy.get(`${fieldPrefix}-colors`)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      cy.dropdownMultiSelectDynamic("Red");

      // Check for alert
      cy.get(commonlocators.toastmsg).contains("BLUE, RED");
      deployMode.NavigateBacktoEditor();
    });

    it("3. shows updated formData values in onOptionChange binding", () => {
      const schema = {
        color: "BLUE",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("color");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);

      // Add onOptionChange action
      propPane.EnterJSContext(
        "onOptionChange",
        "{{showAlert(formData.color)}}",
      );
      deployMode.DeployApp();
      // Click on select field
      cy.get(`${fieldPrefix}-color`)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });

      // Select "Red" option
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Red")
        .click({ force: true });

      // Check for alert
      cy.get(commonlocators.toastmsg).contains("RED");
      deployMode.NavigateBacktoEditor();
    });

    it("4. Shows updated formData values in onOptionChange binding", () => {
      const schema = {
        name: "John",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
      cy.openFieldConfiguration("name");

      // Add onTextChanged action
      propPane.EnterJSContext("onTextChanged", "{{showAlert(formData.name)}}");

      deployMode.DeployApp();
      // Change input value
      cy.get(`${fieldPrefix}-name`).click();
      cy.get(`${fieldPrefix}-name`).type(" Doe");

      // Check for alert
      cy.get(commonlocators.toastmsg).contains("John Doe");
    });
  },
);
