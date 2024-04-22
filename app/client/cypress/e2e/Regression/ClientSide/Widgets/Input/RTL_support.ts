import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.Widget", "@tag.Input"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
  });

  it("1. Test RTL support", () => {
    featureFlagIntercept({
      license_widget_rtl_support_enabled: false,
    });

    agHelper.AssertElementAbsence(`${locators._propertyControl}enablertl`);

    featureFlagIntercept({
      license_widget_rtl_support_enabled: true,
    });

    agHelper.RefreshPage();

    agHelper.AssertElementExist(`${locators._propertyControl}enablertl`);

    propPane.TogglePropertyState("Enable RTL", "On");

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(
        draggableWidgets.INPUT_V2,
      )} .label-container`,
      "direction",
      "rtl",
    );

    agHelper.AssertProperty(
      `${locators._widgetInDeployed(
        draggableWidgets.INPUT_V2,
      )} .label-container`,
      "dir",
      "rtl",
    );

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(
        draggableWidgets.INPUT_V2,
      )} .label-container`,
      "direction",
      "ltr",
    );

    agHelper.AssertProperty(
      `${locators._widgetInDeployed(
        draggableWidgets.INPUT_V2,
      )} .label-container`,
      "dir",
      "ltr",
    );
  });
});
