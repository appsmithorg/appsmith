import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import {
  checkboxlocators,
  switchlocators,
} from "../../../../../locators/WidgetLocators";

import widgetsLoc from "../../../../../locators/Widgets.json";
import widgets from "../../../../../locators/publishWidgetspage.json";
import commonlocators from "../../../../../locators/commonlocators.json";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Switchgroup Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Switch"] },
  function () {
    /**
     * Adding switch group, checkbox group and text widgets
     */
    before(() => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.SWITCHGROUP,
        300,
        300,
      );
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.CHECKBOXGROUP,
        300,
        500,
      );
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 700);
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{SwitchGroup1.selectedValues[0]}}",
      );
    });

    it("1. Check for empty, duplicate values and other error texts in options", () => {
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
      {
        "label": "Blue",
        "value": ""
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
      );
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
      {
        "label": "Blue",
        "value": ""
      },
      {
        "label": "Green",
        "value": ""
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
      );
      agHelper.VerifyEvaluatedErrorMessage(
        "Duplicate values found for the following properties," +
          " in the array entries, that must be unique -- label,value.",
      );
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
        {
          "value": "Blue"
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
      );
      agHelper.VerifyEvaluatedErrorMessage(
        "Invalid entry at index: 0. Missing required key: label",
      );
      propPane.UpdatePropertyFieldValue("Options", "hello");
      agHelper.VerifyEvaluatedErrorMessage(
        'This value does not evaluate to type Array<{ "label": "string", "value": "string" }>',
      );

      // asserts if new option added is not checked
      const newOption = `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      },
      {
        "label": "Yellow",
        "value": "YELLOW"
      }
    ]`;
      propPane.UpdatePropertyFieldValue("Options", newOption);
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Yellow"))
        .should("not.be.checked");
    });

    it("2. test default selected value func and error texts", () => {
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
      );

      propPane.UpdatePropertyFieldValue("Default selected values", "1");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type Array<string>",
      );
      propPane.UpdatePropertyFieldValue("Default selected values", "[]");
      agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        '["RED", "GREEN"]',
      );
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Red"))
        .should("be.checked");
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Green"))
        .should("be.checked");

      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        "{{CheckboxGroup1.selectedValues}}",
      );

      EditorNavigation.SelectEntityByName("CheckboxGroup1", EntityType.Widget);
      agHelper.GetNClick(checkboxlocators.checkBoxLabel("Blue"));
      agHelper.GetNClick(checkboxlocators.checkBoxLabel("Red"));
      agHelper.GetNClick(checkboxlocators.checkBoxLabel("Green"));
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Blue"))
        .should("not.be.checked");
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Red"))
        .should("be.checked");
      agHelper
        .GetElement(switchlocators.switchGroupToggleChecked("Green"))
        .should("be.checked");
    });

    //Note:  Old case, rewrittwen to using ts methods
    it("3. Setting selectedValues to undefined does not crash the app", () => {
      // Reset options for switch group
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green1",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
      );
      // throw a cyclic dependency error from checkbox group
      EditorNavigation.SelectEntityByName("CheckboxGroup1", EntityType.Widget);
      agHelper.TypeText(widgetsLoc.RadioInput, "{{BLUE}}", 1);
      propPane.ToggleJSMode("Options", true);
      agHelper.AssertElementAbsence(locators._toastMsg);
      agHelper.GetNAssertElementText(widgets.textWidget, "");
    });

    it("4. Set Label, Tooltip, Inline and check switch group", () => {
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "SG Widget");
      propPane.UpdatePropertyFieldValue("Tooltip", "Select any color");
      // assert label and tooltip
      deployMode.DeployApp();
      agHelper.AssertText(switchlocators.switchGroupLabel, "text", "SG Widget");
      agHelper.GetNClick(switchlocators.switchTooltip, 1);
      agHelper.AssertPopoverTooltip("Select any color");
      deployMode.NavigateBacktoEditor();
      // assert height of the container based on inline property value
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      agHelper.AssertElementExist(switchlocators.switchWidgetHeight("60"));
      propPane.TogglePropertyState("Inline", "Off");
      agHelper.AssertElementExist(switchlocators.switchWidgetHeight("110"));
    });

    it("5. Check visible, disabled, Height", () => {
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");
      agHelper.HoverElement(propPane._autoHeightLimitMin);
      agHelper.AssertElementExist(propPane._autoHeightLimitMin);
      agHelper.AssertElementExist(propPane._autoHeightLimitMax);

      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(switchlocators.switchGroupLabel);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");

      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp();
      agHelper.AssertElementExist(commonlocators.disabledField);
      deployMode.NavigateBacktoEditor();
    });

    it("6. Check events - on selection change", () => {
      EditorNavigation.SelectEntityByName("SwitchGroup1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Height", "Auto Height");
      propPane.TogglePropertyState("Inline", "On");
      propPane.TogglePropertyState("Disabled", "Off");
      propPane.ToggleJSMode("onSelectionChange", true);
      // reset text widget on selecting default color in switch group
      propPane.UpdatePropertyFieldValue(
        "onSelectionChange",
        "{{resetWidget('Text1', true);}}",
      );
      agHelper.GetNClick(
        switchlocators.switchGroupToggleChecked("Blue"),
        0,
        true,
      );
      agHelper.GetNClick(
        switchlocators.switchGroupToggleChecked("Red"),
        0,
        true,
      );
      agHelper.AssertElementVisibility(locators._visibleTextSpan("BLUE"));
    });
  },
);
