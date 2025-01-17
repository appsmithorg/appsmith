import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

import widgets from "../../../../../locators/Widgets.json";
import commonloc from "../../../../../locators/commonlocators.json";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Switch widget testcases",
  { tags: ["@tag.All", "@tag.Switch", "@tag.Binding"] },
  () => {
    const jsonData = `[
        {
          "name": "yes",
          "code": "yes"
        },
        {
          "name": "no",
          "code": "no"
        }
      ]`;

    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SWITCH);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 500, 200);
      propPane.ToggleJSMode("Source Data", true);
      propPane.UpdatePropertyFieldValue("Source Data", jsonData);
      propPane.UpdatePropertyFieldValue("Default selected value", "no");
    });

    it("1. Validate general properties - Default state values set via JS", () => {
      EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
      // set default state value to be fetched via the value set in select widget
      propPane.EnterJSContext(
        "Default state",
        "{{Select1.selectedOptionValue == 'yes'}}",
      );
      // default value of select widget is set to 'no' so validate switch is off
      agHelper.AssertElementExist(widgets.switchWidgetInactive);
      // local function to test default state values
      testSwitchDefaultState("yes");
      testSwitchDefaultState("no");
      // Check the switch is on and off based on select widget value in deploy mode
      deployMode.DeployApp();
      testSwitchDefaultState("yes");
      testSwitchDefaultState("no");
      deployMode.NavigateBacktoEditor();
      // Check the switch is on and off based on select widget value in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      testSwitchDefaultState("yes");
      testSwitchDefaultState("no");
      agHelper.GetNClick(locators._backToEditor);
    });

    it("2. Validate general properties - Visible via JS", () => {
      EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
      propPane.EnterJSContext("Default state", "true");
      propPane.EnterJSContext(
        "Visible",
        "{{Select1.selectedOptionValue == 'yes'}}",
      );

      deployMode.DeployApp();
      agHelper.AssertElementAbsence(widgets.switchWidget);
      testSwitchVisbility("yes");
      testSwitchVisbility("no");
      deployMode.NavigateBacktoEditor();

      agHelper.GetNClick(locators._enterPreviewMode);
      testSwitchVisbility("yes");
      testSwitchVisbility("no");
      agHelper.GetNClick(locators._backToEditor);
    });

    it("3. Validate general properties - Disabled", () => {
      EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "true");
      propPane.EnterJSContext("Default state", "false");

      propPane.EnterJSContext(
        "Disabled",
        "{{Select1.selectedOptionValue == 'yes'}}",
      );

      deployMode.DeployApp();
      testSwitchDisabled("yes");
      testSwitchDisabled("no");
      deployMode.NavigateBacktoEditor();

      agHelper.GetNClick(locators._enterPreviewMode);
      testSwitchDisabled("yes");
      testSwitchDisabled("no");
      agHelper.GetNClick(locators._backToEditor);
    });

    it("4. Validate error texts", () => {
      EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
      propPane.EnterJSContext("Default state", "90");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type boolean",
      );
      propPane.EnterJSContext("Default state", "TRUE");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type boolean",
      );
      propPane.EnterJSContext("Visible", "0");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type boolean",
      );
      propPane.EnterJSContext("Visible", "FALSE");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type boolean",
      );
      propPane.EnterJSContext("Disabled", "{{Status1.value}}");
      agHelper.VerifyEvaluatedErrorMessage("Status1 is not defined");
    });

    it("5. validate on change - via JS", () => {
      EditorNavigation.SelectEntityByName("Switch1", EntityType.Widget);
      propPane.EnterJSContext("Default state", "false");
      propPane.EnterJSContext("Visible", "true");
      propPane.EnterJSContext("Disabled", "false");
      propPane.EnterJSContext(
        "onChange",
        "{{showAlert('Switch action perfomed')}}",
      );
      agHelper.GetNClick(widgets.switch);
      agHelper.ValidateToastMessage("Switch action perfomed");
      deployMode.DeployApp();
      agHelper.GetNClick(widgets.switch);
      agHelper.ValidateToastMessage("Switch action perfomed");
    });

    // based on the dropdown value set the switch widget is disabled or enabled
    function testSwitchDisabled(dropdownValue: string): void {
      agHelper.GetNClick(commonloc.selectButton);
      agHelper.GetNClickByContains(table._selectMenuItem, dropdownValue);
      if (dropdownValue == "yes") {
        agHelper.AssertElementClassContainsDisabled(
          widgets.switchWidgetInactive,
        );
      } else {
        agHelper.AssertElementExist(widgets.switchWidgetInactive);
      }
    }

    function testSwitchVisbility(visibilityValue: string): void {
      // In the select widget set the given value and assert switch widget is visible or not based on it
      agHelper.GetNClick(commonloc.selectButton);
      agHelper.GetNClickByContains(table._selectMenuItem, visibilityValue);
      if (visibilityValue == "yes") {
        agHelper.AssertElementExist(widgets.switchWidget);
      } else {
        agHelper.AssertElementAbsence(widgets.switchWidget);
      }
    }

    function testSwitchDefaultState(dropdownValue: string): void {
      // In the select widget set no and assert switch is off
      agHelper.GetNClick(commonloc.selectButton);
      agHelper.GetNClickByContains(table._selectMenuItem, dropdownValue);
      if (dropdownValue == "yes") {
        agHelper.AssertElementExist(widgets.switchWidgetActive);
        agHelper.AssertElementAbsence(widgets.switchWidgetInactive);
      } else {
        agHelper.AssertElementExist(widgets.switchWidgetInactive);
        agHelper.AssertElementAbsence(widgets.switchWidgetActive);
      }
    }
  },
);
