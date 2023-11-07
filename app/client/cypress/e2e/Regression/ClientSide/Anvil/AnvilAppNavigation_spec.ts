import { WIDGET } from "../../../../locators/WidgetLocators";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/canvas/utils";

describe(`${ANVIL_EDITOR_TEST}: Validating multiple widgets in anvil layout mode with App navigation settings`, function () {
  it("1. Change App navigation settings and valdiate the layout settings", () => {
    const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
    agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
      const x = mainCanvas.position().left;
      const y = mainCanvas.position().top;
      entityExplorer.DragDropWidgetNVerify(WIDGET.WDSINPUT, x, y + 20, {
        skipWidgetSearch: true,
      });
      entityExplorer.DragDropWidgetNVerify(WIDGET.WDSINPUT, x, y + 20, {
        skipWidgetSearch: true,
      });
      entityExplorer.DragDropWidgetNVerify(WIDGET.WDSBUTTON, x, y + 20, {
        skipWidgetSearch: true,
      });
    });
    propPane.NavigateToPage("Page1", "onClick");
    entityExplorer.SelectEntityByName("Page1", "Pages");
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
    );
    agHelper.AssertElementExist(appSettings.locators._sideNavbar);
    agHelper.GetNClick(locators._canvas);
    agHelper.AssertElementExist(locators._widgetInCanvas(WIDGET.WDSINPUT));
    agHelper.AssertElementExist(locators._widgetInCanvas(WIDGET.WDSINPUT), 1);
  });
});
