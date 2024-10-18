import {
  agHelper,
  deployMode,
  draggableWidgets,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const dsl = require("../../../../../fixtures/listdsl.json");

describe(
  "List Widget Functionality",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    const items = JSON.parse(dsl.dsl.children[0].listData);

    before(() => {
      agHelper.AddDsl("listdsl");
    });

    it("1. Validate Visibility via Toggle", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Uncheck the disabled checkbox and validate
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.LIST),
      );
      deployMode.NavigateBacktoEditor();
      // List-Check Visible field Validation
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Check the disableed checkbox and Validate
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("2. Validate Visibility via JS Mode", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Uncheck the disabled checkbox using JS and validate
      propPane.EnterJSContext("Visible", "false");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.LIST),
      );
      deployMode.NavigateBacktoEditor();
      //Toggle JS - List-Check Visible field Validation
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Check the disabled checkbox using JS and Validate
      propPane.EnterJSContext("Visible", "true");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.LIST),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("3. checks if list shows correct no. of items", function () {
      // Verify the length of list
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        2,
      );
      //checks currentItem binding
      // Open property pane
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.expandCollapseItem("List1");
      PageLeftPane.expandCollapseItem("Container1");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "List1",
        "Container1",
      ]);
      propPane.UpdatePropertyFieldValue("Text", `{{currentItem.first_name}}`);
      // Verify Current Item Bindings
      agHelper.GetNAssertElementText(
        propPane._propertyText,
        items[0].first_name,
        "contain.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._propertyText,
        items[1].first_name,
        "contain.text",
        1,
      );
    });

    it("4. doesn't alter the no of items present when invalid item spacing is entered", () => {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.MoveToTab("Style");
      // Update an invalid value to item spacing
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "-");
      // Verify the length of list
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        2,
      );
      // Clear item spacing
      propPane.UpdatePropertyFieldValue("Item Spacing (px)", "");
      agHelper.Sleep(2000);
    });

    it("5. checks button action", function () {
      // Open property pane
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Label", `{{currentItem.last_name}}`);
      propPane.SelectPlatformFunction("onClick", "Show alert");
      agHelper.EnterActionValue("Message", "{{currentItem.last_name}}");
      agHelper.Sleep(3000);
      deployMode.DeployApp();
      // Verify Widget Button by clicking on it
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        2,
      );
      agHelper.ClickButton("Lawson");
      // Verify the click on first button
      agHelper.ValidateToastMessage(items[0].last_name);
    });

    it("6. it checks onListItem click action", function () {
      // Verify Clicking on list item shows message of first name
      deployMode.NavigateBacktoEditor(); // Open property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      // Verify Action type and Message of List Item
      // Click on the onListItemClick action dropdown.
      // Write binding inside the Message code textarea
      propPane.SelectPlatformFunction("onListItemClick", "Show alert", true);
      agHelper.EnterActionValue("Message", "{{currentItem.first_name}}");
      deployMode.DeployApp();
      // Click on list first item
      agHelper.GetNClickByContains(
        locators._textWidgetContaioner,
        "Michael",
        0,
        true,
      );
      // Verify the click on first item
      agHelper.ValidateToastMessage(items[0].first_name);
    });

    it("7. it checks pagination", function () {
      // clicking on second pagination button
      table.NavigateToSpecificPage_List(2, "v1");

      // now we are on the second page which shows first the 3rd item in the list
      agHelper.GetNAssertElementText(
        propPane._propertyText,
        items[2].first_name,
        "contain.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._propertyText,
        items[3].first_name,
        "contain.text",
        1,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("8. ListWidget-Copy & Delete Verification", function () {
      //Copy Chart and verify all properties
      propPane.CopyPasteWidgetFromPropertyPane("List1");
      propPane.DeleteWidgetFromPropertyPane("List1Copy");
      deployMode.DeployApp();
      // Verify the copied list widget is deleted
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        2,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("9. List widget background colour and deploy ", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.MoveToTab("Style");
      // Scroll down to Styles and Add background colour
      propPane.SelectColorFromColorPicker("backgroundcolor", -15);
      agHelper.Sleep(1000);
      propPane.SelectColorFromColorPicker("itembackgroundcolor", -15);
      // Click on Deploy and ensure it is deployed appropriately
      deployMode.DeployApp();
      // Ensure List Background Color
      agHelper.AssertCSS(
        locators._listWidget,
        "background-color",
        "rgb(219, 234, 254)",
      );
      // Verify List Item Background Color
      agHelper.AssertCSS(
        locators._itemContainerWidget,
        "background-color",
        "rgb(219, 234, 254)",
      );
      deployMode.NavigateBacktoEditor();
    });

    it("10. Toggle JS - List widget background colour and deploy ", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.MoveToTab("Style");
      // Scroll down to Styles and Add background colour
      propPane.EnterJSContext("Background color", "#FFC13D");
      agHelper.Sleep(1000);
      propPane.EnterJSContext("Item Background color", "#38AFF4");
      // Click on Deploy and ensure it is deployed appropriately
      deployMode.DeployApp();
      // Ensure List Background Color
      agHelper.AssertCSS(
        locators._listWidget,
        "background-color",
        "rgb(255, 193, 61)",
        0,
      );
      // Verify List Item Background Color
      agHelper.AssertCSS(
        locators._itemContainerWidget,
        "background-color",
        "rgb(56, 175, 244)",
        0,
      );
      deployMode.NavigateBacktoEditor();
    });
  },
);
