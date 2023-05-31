import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validating multiple widgets in auto layout mode with App navigation settings", function () {
  it("1. Drag and Drop multiple widgets in auto layout mode", function () {
    _.autoLayout.ConvertToAutoLayout();
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      100,
      200,
    );
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.INPUT_V2, 10, 20);
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 10, 20);
    _.propPane.NavigateToPage("Page1", "onClick");
  });
  it("2. Change App navigation settings and valdiate the layout settings", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.agHelper.GetNClick(_.appSettings.locators._appSettings);
    _.agHelper.GetNClick(_.appSettings.locators._generalSettingsHeader);
    _.agHelper.GetNClick(
      _.appSettings.locators._navigationSettings._orientationOptions._side,
    );
    _.agHelper.GetNClickByContains(
      _.appSettings.locators._navigationMenuItem,
      "Page1",
    );
    _.agHelper.Sleep();
    _.agHelper.Sleep();
    _.agHelper.AssertElementExist(_.locators._widgetInCanvas("inputwidgetv2"));
    _.agHelper.AssertElementExist(
      _.locators._widgetInCanvas("inputwidgetv2"),
      1,
    );
    _.agHelper.AssertElementExist(_.locators._fixedLayout);
  });
});
