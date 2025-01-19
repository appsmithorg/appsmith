import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.All", "@tag.Select"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT);
  });

  it("1. Test RTL support", () => {
    featureFlagIntercept({
      license_widget_rtl_support_enabled: false,
    });
    agHelper.AssertElementAbsence(".t--property-control-enablertl");
    featureFlagIntercept({
      license_widget_rtl_support_enabled: true,
    });

    agHelper.Sleep(2000);

    agHelper.AssertElementExist(".t--property-control-enablertl");

    propPane.TogglePropertyState("Enable RTL", "On");

    agHelper.GetElement(".t--widget-selectwidget .select-button").click();

    agHelper
      .GetElement(".t--widget-selectwidget .label-container")
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".t--widget-selectwidget .select-button")
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".select-popover-wrapper input.bp3-input")
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".select-popover-wrapper .menu-virtual-list")
      .should("have.css", "direction", "rtl");

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper
      .GetElement(".t--widget-selectwidget .label-container")
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".t--widget-selectwidget .select-button")
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".select-popover-wrapper input.bp3-input")
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".select-popover-wrapper .menu-virtual-list")
      .should("have.css", "direction", "ltr");
  });
});
