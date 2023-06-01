import appNavigationLocators from "../../../../locators/AppNavigation.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";
const deployMode = ObjectsRegistry.DeployMode;
let currentUrl: string | null = null;

describe("Validating multiple widgets in auto layout mode with App navigation settings", function () {
  it("1. Drag and Drop multiple widgets in auto layout mode", function () {
    _.autoLayout.ConvertToAutoLayoutAndVerify(false);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 100, 200);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 10, 20);
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 10, 20);
    _.propPane.navigateToPage("Page1", "onClick");
  });
  it("2. Change App navigation settings and valdiate the layout settings", () => {
    _.agHelper.GetNClick("[data-testid='t--entity-item-Page1']");
    _.agHelper.GetNClick(appNavigationLocators.appSettingsButton);
    _.agHelper.GetNClick(appNavigationLocators.navigationSettingsTab);
    _.agHelper.GetNClick(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    );
    _.agHelper.GetNClickByContains(
      appNavigationLocators.navigationMenuItem,
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
