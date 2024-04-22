import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
  locators,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.Widget", "@tag.Select"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT);
  });

  it("1. Test RTL support", () => {
    featureFlagIntercept({
      license_widget_rtl_support_enabled: false,
    });
    agHelper.AssertElementAbsence(`${locators._propertyControl}enablertl`);
    featureFlagIntercept({
      license_widget_rtl_support_enabled: true,
    });

    agHelper.AssertElementExist(`${locators._propertyControl}enablertl`);

    propPane.TogglePropertyState("Enable RTL", "On");

    agHelper.GetNClick(
      `${locators._widgetInDeployed(draggableWidgets.SELECT)}`,
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.SELECT)} .label-container`,
      "direction",
      "rtl",
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.SELECT)} ${
        widgetLocators.selectWidgetBtn
      }`,
      "direction",
      "rtl",
    );

    agHelper.AssertCSS(widgetLocators.selectWidgetFilter, "direction", "rtl");

    agHelper.AssertCSS(widgetLocators.selectWidgetMenu, "direction", "rtl");

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.SELECT)} .label-container`,
      "direction",
      "ltr",
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.SELECT)} ${
        widgetLocators.selectWidgetBtn
      }`,
      "direction",
      "ltr",
    );

    agHelper.AssertCSS(widgetLocators.selectWidgetFilter, "direction", "ltr");

    agHelper.AssertCSS(widgetLocators.selectWidgetMenu, "direction", "ltr");
  });
});
