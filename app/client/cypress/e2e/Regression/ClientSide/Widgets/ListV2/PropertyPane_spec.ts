import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "List widget V2 PropertyPane",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    it("1. Validate isVisible", () => {
      entityExplorer.DragDropWidgetNVerify("listwidgetv2", 300, 300);
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      deployMode.NavigateBacktoEditor();
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Check the disableed checkbox and Validate
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("2. Toggle JS - Validate isVisible", function () {
      // Open Property pane
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Uncheck the disabled checkbox using JS and validate
      propPane.ToggleJSMode("Visible", true);
      propPane.UpdatePropertyFieldValue("Visible", "false");
      deployMode.DeployApp();
      agHelper.Sleep();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      deployMode.NavigateBacktoEditor();
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Check the disabled checkbox using JS and Validate
      propPane.UpdatePropertyFieldValue("Visible", "true");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("3. Renaming the widget from Property pane and Entity explorer ", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      // Change the list widget name from property pane and Verify it
      propPane.RenameWidget("List1", "List2");
      // Change the list widget name from Entity Explorer
      entityExplorer.RenameEntityFromExplorer("List2", "List1", true);
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      // Verify the list name is changed
      agHelper.AssertElementVisibility(locators._widgetName("List1"));
    });

    it("4. Item Spacing Validation ", function () {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.Search("item spacing");
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "-1");
      agHelper.VerifyEvaluatedErrorMessage("Minimum allowed value: 0");
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "10");
    });
  },
);
