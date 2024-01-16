import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.Widget", "@tag.Input"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
  });

  it("1. Test RTL support", () => {
    featureFlagIntercept({
      license_widget_rtl_support_enabled: false,
    });

    agHelper.AssertElementAbsence(".t--property-control-enablertl");

    featureFlagIntercept({
      license_widget_rtl_support_enabled: true,
    });

    agHelper.RefreshPage();

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(".t--property-control-enablertl");

    propPane.TogglePropertyState("Enable RTL", "On");

    agHelper.AssertElementExist(
      ".t--widget-inputwidgetv2 .bp3-input-group.rtl",
    );

    agHelper.AssertElementExist(
      ".t--widget-inputwidgetv2 .label-container[dir='rtl']",
    );

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper.AssertElementAbsence(
      ".t--widget-inputwidgetv2 .bp3-input-group.rtl",
    );

    agHelper.AssertElementAbsence(
      ".t--widget-inputwidgetv2 .label-container[dir='rtl']",
    );
  });
});
