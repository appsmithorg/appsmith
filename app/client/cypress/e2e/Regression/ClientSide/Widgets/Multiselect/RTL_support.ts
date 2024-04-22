import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.Widget", "@tag.Multiselect"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.MULTISELECT);
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

    agHelper.GetNClick(
      locators._widgetInDeployed(draggableWidgets.MULTISELECT),
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.MULTISELECT)} ${
        locators._multiSelectContainer
      }`,
      "direction",
      "rtl",
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(
        draggableWidgets.MULTISELECT,
      )} .rc-select-selector`,
      "direction",
      "rtl",
    );

    agHelper.AssertCSS(
      `${locators._multiSelectDropdown} ${locators._input}`,
      "direction",
      "rtl",
    );

    agHelper.AssertElementExist(".rc-select-dropdown [dir='rtl']");

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(draggableWidgets.MULTISELECT)} ${
        locators._multiSelectContainer
      }`,
      "direction",
      "ltr",
    );

    agHelper.AssertCSS(
      `${locators._widgetInDeployed(
        draggableWidgets.MULTISELECT,
      )} .rc-select-selector`,
      "direction",
      "ltr",
    );

    agHelper.AssertCSS(
      `${locators._multiSelectDropdown} ${locators._input}`,
      "direction",
      "ltr",
    );

    agHelper.AssertElementExist(".rc-select-dropdown [dir='ltr']");
  });
});
