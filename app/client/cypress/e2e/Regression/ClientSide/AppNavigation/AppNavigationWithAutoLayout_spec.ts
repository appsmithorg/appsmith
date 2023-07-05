import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  appSettings,
  autoLayout,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Validating multiple widgets in auto layout mode with App navigation settings", function () {
  it("1. Drag and Drop multiple widgets in auto layout mode", function () {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 100, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 10, 20);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 10, 20);
    propPane.NavigateToPage("Page1", "onClick");
  });

  it("2. Change App navigation settings and valdiate the layout settings", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
    );
    agHelper.AssertElementExist(appSettings.locators._sideNavbar);
    agHelper.GetNClick(locators._canvas);
    agHelper.AssertElementExist(locators._widgetInCanvas("inputwidgetv2"));
    agHelper.AssertElementExist(locators._widgetInCanvas("inputwidgetv2"), 1);
    agHelper.AssertElementExist(locators._fixedLayout);
  });
});
