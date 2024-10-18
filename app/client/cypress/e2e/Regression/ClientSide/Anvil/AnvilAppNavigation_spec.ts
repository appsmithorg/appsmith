import { WIDGET } from "../../../../locators/WidgetLocators";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import {
  agHelper,
  locators,
  propPane,
  appSettings,
  anvilLayout,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

describe(
  `${ANVIL_EDITOR_TEST}: Validating multiple widgets in anvil layout mode with App navigation settings`,
  { tags: ["@tag.Anvil", "@tag.IDE", "@tag.PropertyPane"] },
  function () {
    beforeEach(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Change App navigation settings and valdiate the layout settings", () => {
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSINPUT,
        5,
        20,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSINPUT,
        5,
        20,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        5,
        20,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      propPane.NavigateToPage("Page1", "onClick");
      appSettings.OpenAppSettings();
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      // assert that the default value of "Show Navbar" is "Off" for anvil apps
      agHelper.AssertExistingCheckedState(
        appSettings.locators._navigationSettings._showNavbar,
        "false",
      );
      // enable the navigation
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._showNavbar,
        0,
        true,
      );
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._side,
      );
      agHelper.AssertElementExist(appSettings.locators._sideNavbar);
      agHelper.GetNClick(locators._canvas);
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSINPUT),
      );
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSINPUT),
        1,
      );
    });
  },
);
