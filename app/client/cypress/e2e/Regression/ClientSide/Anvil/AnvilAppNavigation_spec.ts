import { WIDGET } from "../../../../locators/WidgetLocators";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  appSettings,
  anvilLayout,
} from "../../../../support/Objects/ObjectsCore";
import { MAIN_CONTAINER_WIDGET_ID } from "../../../../../src/constants/WidgetConstants";
import { getAnvilCanvasId } from "../../../../../src/layoutSystems/anvil/canvas/utils";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(`${ANVIL_EDITOR_TEST}: Validating multiple widgets in anvil layout mode with App navigation settings`, function () {
  beforeEach(() => {
    // intercept features call for Anvil + WDS tests
    featureFlagIntercept({ release_anvil_enabled: true, ab_wds_enabled: true });
    // Cleanup the canvas before each test
    agHelper.SelectAllWidgets(`#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`);
    agHelper.PressDelete();
  });
  it("1. Change App navigation settings and valdiate the layout settings", () => {
    const mainCanvasId = `#${getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID)}`;
    agHelper.AssertElementExist(mainCanvasId).then((mainCanvas) => {
      const x = mainCanvas.position().left;
      const y = mainCanvas.position().top;
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSINPUT, x + 5, y + 20, {
        skipWidgetSearch: true,
      });
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSINPUT, x + 5, y + 20, {
        skipWidgetSearch: true,
      });
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSBUTTON, x + 5, y + 20, {
        skipWidgetSearch: true,
      });
    });
    propPane.NavigateToPage("Page1", "onClick");
    appSettings.OpenAppSettings();
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
