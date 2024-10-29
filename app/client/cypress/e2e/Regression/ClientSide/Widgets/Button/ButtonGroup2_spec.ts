import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

import { buttongroupwidgetlocators } from "../../../../../locators/WidgetLocators";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Button Group Widget Test",
  { tags: ["@tag.Widget", "@tag.Button", "@tag.Binding"] },
  function () {
    before("Login to the app and navigate to the workspace", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON_GROUP);
    });

    it("1. Add, Delete more buttons to the group and verify", function () {
      const newButtonLabel =
        Cypress.env("MESSAGES").BUTTON_WIDGET_DEFAULT_LABEL();

      agHelper.GetNClick(buttongroupwidgetlocators.newButton);
      agHelper.TypeText(`//*[ @value='${newButtonLabel}']`, " New Button");
      agHelper.AssertContains(`${newButtonLabel} New Button`);
      deployMode.DeployApp();
      agHelper
        .GetElement(buttongroupwidgetlocators.buttongroup)
        .children()
        .should("have.length", 4);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      agHelper.GetNClick(table._deleteColumn, 3);
      deployMode.DeployApp();
      agHelper
        .GetElement(buttongroupwidgetlocators.buttongroup)
        .children()
        .should("have.length", 3);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
    });

    it("2. Add, Delete menu item to a button group and verify", function () {
      // Setting menu values in button More
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 2);
      agHelper.GetNClick(buttongroupwidgetlocators.menu);
      agHelper.GetNClick(propPane._tableEditColumnButton, 0);
      propPane.UpdatePropertyFieldValue("Text", "Option1");
      agHelper.GetNClick(propPane._goBackToProperty);
      agHelper.GetNClick(propPane._tableEditColumnButton, 1);
      propPane.UpdatePropertyFieldValue("Text", "Option2");
      agHelper.GetNClick(propPane._goBackToProperty);
      agHelper.GetNClick(propPane._tableEditColumnButton, 2);
      propPane.UpdatePropertyFieldValue("Text", "Option3");
      agHelper.GetNClick(propPane._goBackToProperty);
      //deploy and assert all menu values are present
      deployMode.DeployApp();
      agHelper.ClickButton("More");
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option1"),
      );
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option2"),
      );
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option3"),
      );
      // delete a menu option and asserts its not available
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 2);
      agHelper.GetNClick(buttongroupwidgetlocators.menu);
      agHelper.GetNClick(table._deleteColumn, 2);
      deployMode.DeployApp();
      agHelper.ClickButton("More");
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option1"),
      );
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option2"),
      );
      agHelper.AssertElementAbsence(
        buttongroupwidgetlocators.buttonMenuOptions("Option3"),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
    });

    it("3. Assert button group options - single and menu visibility ", function () {
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(buttongroupwidgetlocators.buttongroup);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 1);
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(locators._buttonByText("Add"));
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 1);
      propPane.TogglePropertyState("Visible", "On");
      agHelper.GetNClick(propPane._goBackToProperty);
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 2);
      // Setting menu values in button More
      agHelper.GetNClick(buttongroupwidgetlocators.menu);
      agHelper.GetNClick(buttongroupwidgetlocators.menuSettingInPropPane, 0);
      propPane.UpdatePropertyFieldValue("Text", "Option 1");
      agHelper.GetNClick(propPane._goBackToProperty);
      agHelper.GetNClick(buttongroupwidgetlocators.menuSettingInPropPane, 1);
      propPane.UpdatePropertyFieldValue("Text", "Option 2");
      // goto more
      agHelper.GetNClick(propPane._goBackToProperty);
      //goto the button group
      agHelper.GetNClick(propPane._goBackToProperty);
      // goto to 1st menu option in more and set it to visible false
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 2);
      agHelper.GetNClick(buttongroupwidgetlocators.menu);
      agHelper.GetNClick(buttongroupwidgetlocators.menuSettingInPropPane, 0);
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.ClickButton("More");
      // assert option 1 is not visible as its visibility set to false
      agHelper.AssertElementAbsence(
        buttongroupwidgetlocators.buttonMenuOptions("Option 1"),
      );
      agHelper.AssertElementExist(
        buttongroupwidgetlocators.buttonMenuOptions("Option 2"),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("4. Assert button group options - single and menu disability ", function () {
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      deployMode.DeployApp();
      agHelper.AssertElementExist(buttongroupwidgetlocators.buttongroup);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp();
      agHelper.AssertElementEnabledDisabled(buttongroupwidgetlocators.button);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      propPane.TogglePropertyState("Disabled", "Off");
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 2);
      // // Setting menu values in button More
      agHelper.GetNClick(buttongroupwidgetlocators.menu);
      agHelper.GetNClick(buttongroupwidgetlocators.menuSettingInPropPane, 0);
      propPane.TogglePropertyState("Disabled", "On");
      propPane.TogglePropertyState("Visible", "On", "updateLayout");
      agHelper.GetNClick(propPane._goBackToProperty);
      deployMode.DeployApp();
      agHelper.ClickButton("More");
      agHelper.AssertElementClassContainsDisabled("//*[text()='Option 1']/..");
      deployMode.NavigateBacktoEditor();
    });

    it("5. Assert On click button group ", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL, 250, 250);
      agHelper.ClickButton("Close");
      EditorNavigation.SelectEntityByName("ButtonGroup1", EntityType.Widget);
      agHelper.GetNClick(buttongroupwidgetlocators.buttonSettingInPropPane, 0);
      propPane.EnterJSContext("onClick", "{{showModal(Modal1.name)}}");
      deployMode.DeployApp();
      agHelper.ClickButton("Favorite");
      agHelper.AssertElementExist(locators._modal);
      agHelper.ClickButton("Close");
    });
  },
);
