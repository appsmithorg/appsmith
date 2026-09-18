import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "List widget v2 disableSelection",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    const listItemContainer = () => locators._listV2ItemContainer("List1");

    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.LIST_V2, 300, 400);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 50, 50);
      propPane.UpdatePropertyFieldValue("Text", "{{List1.selectedItem.name}}");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 50, 120);
      propPane.UpdatePropertyFieldValue("Text", "{{List1.triggeredItem.name}}");
    });

    it("1. Default: row click selects the item and shows a pointer cursor", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.AssertIfPropertyIsVisible("onitemclick");

      agHelper.GetElement(listItemContainer()).first().realHover();
      agHelper.AssertCSS(listItemContainer(), "cursor", "pointer");

      agHelper.GetNAssertContains(
        locators._widgetByName("Text3"),
        "Blue",
        "not.exist",
      );
      agHelper.GetNClick(listItemContainer(), 0, true);
      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Blue");
      agHelper.GetNClick(listItemContainer(), 1, true);
      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Green");
    });

    it("2. Disable selection on: hides onItemClick, drops pointer, and does not change selectedItem", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.TogglePropertyState("Disable selection", "On");
      // hidden property-config controls are unmounted, not CSS-hidden
      agHelper.AssertElementAbsence(propPane._propertyControl("onitemclick"));

      agHelper.GetElement(listItemContainer()).first().realHover();
      agHelper
        .GetElement(listItemContainer())
        .first()
        .should("not.have.css", "cursor", "pointer");

      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Green");
      agHelper.GetNClick(listItemContainer(), 0, true);
      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Green");
    });

    it("3. Disable selection on: child Button still runs onClick and updates triggeredItem", () => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.BUTTON,
        150,
        50,
        draggableWidgets.CONTAINER,
      );
      propPane.EnterJSContext("onClick", "{{showAlert('btn-click')}}");

      agHelper.ClickButton("Submit", 0);
      agHelper.WaitUntilToastDisappear("btn-click");
      agHelper.GetNAssertContains(locators._widgetByName("Text4"), "Blue");
    });

    it("4. Disable selection on: Default selected item still sets selectedItem", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Default selected item", "001");
      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Blue");
      agHelper.GetNClick(listItemContainer(), 1, true);
      agHelper.GetNAssertContains(locators._widgetByName("Text3"), "Blue");
    });
  },
);
