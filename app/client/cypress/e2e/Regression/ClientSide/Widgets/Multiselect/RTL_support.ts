import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget", { tags: ["@tag.Widget", "@tag.Multiselect"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.MULTISELECT);
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

    agHelper
      .GetElement(".t--widget-multiselectwidgetv2 .rc-select-selector")
      .click();

    agHelper
      .GetElement(
        ".t--widget-multiselectwidgetv2 [data-testid='multiselect-container']",
      )
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".t--widget-multiselectwidgetv2 .rc-select-selector")
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".multi-select-dropdown input.bp3-input")
      .should("have.css", "direction", "rtl");

    agHelper
      .GetElement(".rc-select-dropdown [dir='rtl']", "exist")
      .should("exist");

    propPane.TogglePropertyState("Enable RTL", "Off");

    agHelper
      .GetElement(
        ".t--widget-multiselectwidgetv2 [data-testid='multiselect-container']",
      )
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".t--widget-multiselectwidgetv2 .rc-select-selector")
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".multi-select-dropdown input.bp3-input")
      .should("have.css", "direction", "ltr");

    agHelper
      .GetElement(".rc-select-dropdown [dir='rtl']", "not.exist")
      .should("not.exist");
  });
});
