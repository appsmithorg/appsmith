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

const widgetSelector = (name: string) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

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

    it("2. Validate isVisible when list has selected item (#37683)", () => {
      // Define selectors for widgets
      const widgetSelector = (name: string) => `[data-widgetname-cy="${name}"]`;
      const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

      // Drag and drop the List widget and Button widget onto the canvas
      entityExplorer.DragDropWidgetNVerify("listwidgetv2", 300, 300);
      entityExplorer.DragDropWidgetNVerify("buttonwidget");

      // Set up the button to make the list visible when clicked
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{List1.setVisibility(true)}}`, true);

      // Set up the list widget to become invisible when an item is clicked
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.EnterJSContext(
        "onItemClick",
        `{{List1.setVisibility(false)}}`,
        true,
      );

      // Deploy the application to test the visibility functionality
      deployMode.DeployApp();

      // Simulate a click on the first item in the list to hide the list
      agHelper
        .GetElement(widgetSelector("List1"))
        .find(containerWidgetSelector)
        .first()
        .click({ force: true });
      agHelper.WaitUntilEleDisappear(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );

      // Assert that the list widget is not visible after clicking an item
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );

      // Click the button to make the list visible again
      agHelper.GetNClick(widgetSelector("Button1"));

      // Assert that the list widget is visible after clicking the button
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );

      // Navigate back to the editor after testing
      deployMode.NavigateBacktoEditor();
    });

    it("3. Toggle JS - Validate isVisible", function () {
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

    it("4. Renaming the widget from Property pane and Entity explorer ", function () {
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

    it("5. Item Spacing Validation ", function () {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.Search("item spacing");
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "-1");
      agHelper.VerifyEvaluatedErrorMessage("Minimum allowed value: 0");
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "10");
    });
  },
);
