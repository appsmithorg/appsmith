import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

function deleteAllWidgetsInContainer() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  agHelper.SelectAllWidgets(
    `${locators._widgetByName("List1")} ${locators._containerWidget}`,
  );
  agHelper.PressDelete();
  // Clear All Toast
  agHelper.WaitUntilAllToastsDisappear();
}

describe("List widget v2 onItemClick", () => {
  it("1. List widget V2 with onItemClick", () => {
    entityExplorer.DragDropWidgetNVerify("listwidgetv2", 300, 300);
    entityExplorer.SelectEntityByName("List1");
    propPane.EnterJSContext(
      "onItemClick",
      "{{showAlert('ListWidget_' + currentItem.name + '_' + currentIndex,'success')}}",
      true,
    );
    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._containerWidget}`,
      0,
      true,
    );

    agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._containerWidget}`,
      1,
      true,
    );

    agHelper.WaitUntilToastDisappear("ListWidget_Green_1");

    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._containerWidget}`,
      2,
      true,
    );

    agHelper.WaitUntilToastDisappear("ListWidget_Red_2");
  });

  it("2. List widget V2 with onItemClick should be triggered when child widget without event is clicked", () => {
    //Select first row Image within list
    agHelper.GetNClick(locators._imgWidgetInsideList, 0, true);
    agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

    agHelper.GetNClickByContains(locators._textWidget, "Blue", 0, true);
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

    //This is clicking Select Widget
    agHelper.ClickButton("Green", 0);
    agHelper.AssertElementAbsence(locators._toastMsg);

    deleteAllWidgetsInContainer();

    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.BUTTON,
      250,
      50,
      draggableWidgets.CONTAINER,
    );

    agHelper.ClickButton("Submit", 0);
    agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

    propPane.EnterJSContext("onClick", "{{clearStore()}}");
    agHelper.Sleep(1000);

    agHelper.ClickButton("Submit", 0);
    agHelper.AssertElementAbsence(locators._toastMsg);
  });
});
