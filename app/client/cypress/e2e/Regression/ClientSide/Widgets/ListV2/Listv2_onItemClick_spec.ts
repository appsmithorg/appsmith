import {
    agHelper,
    draggableWidgets,
    entityExplorer,
    propPane,
    locators
} from "../../../../../support/Objects/ObjectsCore";

function deleteAllWidgetsInContainer() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  
    agHelper.GetNClick(`${locators._widgetByName("List1")} ${locators._containerWidget}`, 0, true);
    agHelper.TypeTextWithoutWait("body", `{${modifierKey}}{a}`);
    agHelper.TypeTextWithoutWait("body", "{del}");
  
    agHelper.Sleep(200);

    // Clear All Toast
    agHelper.GetElement(locators._toastMsg).each(($el) => {
        cy.wrap($el).click();
    });
    agHelper.Sleep(1000);
}

describe("List widget v2 onItemClick", () => {
    it("1. List widget V2 with onItemClick", () => {
      entityExplorer.DragDropWidgetNVerify("listwidgetv2", 300, 300);
      entityExplorer.SelectEntityByName("List1");
  
      agHelper.GetNClick(locators._jsToggle("onitemclick"));
      propPane.TypeTextIntoField("onitemclick", 
      "{{showAlert('ListWidget_' + currentItem.name + '_' + currentIndex,'success')}}");
  
      agHelper.GetNClick(`${locators._widgetByName("List1")} ${locators._containerWidget}`, 0, true);
  
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");
  
      agHelper.GetNClick(`${locators._widgetByName("List1")} ${locators._containerWidget}`, 1, true);
  
      agHelper.WaitUntilToastDisappear("ListWidget_Green_1");
  
      agHelper.GetNClick(`${locators._widgetByName("List1")} ${locators._containerWidget}`, 2, true);
  
      agHelper.WaitUntilToastDisappear("ListWidget_Red_2");
    });
  
    it("2. List widget V2 with onItemClick should be triggered when child widget without event is clicked", () => {
      agHelper.GetNClick(locators._widgetByName("Image1"), 0 ,true);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");
  
      agHelper.GetNClick(locators._widgetByName("Text1"), 0 ,true);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");
  
      deleteAllWidgetsInContainer();
  
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        250,
        50,
        draggableWidgets.CONTAINER,
      );
  
      agHelper.GetNClick(`${locators._widgetByName("Input1")} input`, 0, true);
      agHelper.AssertElementAbsence(locators._toastMsg);
  
      deleteAllWidgetsInContainer();
  
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.SELECT,
        250,
        50,
        draggableWidgets.CONTAINER,
      );
  
      agHelper.GetNClick(`${locators._widgetByName("Select1")} button`, 0, true);
      agHelper.AssertElementAbsence(locators._toastMsg);
  
      deleteAllWidgetsInContainer();
  
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.BUTTON,
        250,
        50,
        draggableWidgets.CONTAINER,
      );
  
      agHelper.GetNClick(`${locators._widgetByName("Button1")} button`, 0, true);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");
  
      agHelper.GetNClick(locators._jsToggle("onclick"), 0, true);
      propPane.TypeTextIntoField("onClick", "{{clearStore()}}");
      agHelper.Sleep(1000);
  
      agHelper.GetNClick(`${locators._widgetByName("Button1")} button`, 0, true)
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
});