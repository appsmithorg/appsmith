import {
  agHelper,
  appSettings,
  autoLayout,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  SidebarButton,
} from "../../../../support/Pages/EditorNavigation";

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
    EditorNavigation.ViaSidebar(SidebarButton.Settings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
    );
    agHelper.AssertElementExist(appSettings.locators._sideNavbar);
    EditorNavigation.ViaSidebar(SidebarButton.Pages);
    agHelper.AssertElementExist(locators._widgetInCanvas("inputwidgetv2"));
    agHelper.AssertElementExist(locators._widgetInCanvas("inputwidgetv2"), 1);
    agHelper.AssertElementExist(locators._fixedLayout);
  });
});
