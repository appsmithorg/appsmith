import { WIDGET_TAGS } from "constants/WidgetConstants";
import { WDSInputWidget } from "modules/ui-builder/ui/wds/WDSInputWidget";
import { NumberInputIcon, NumberInputThumbnail } from "appsmith-icons";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";
import { INPUT_TYPES } from "modules/ui-builder/ui/wds/WDSBaseInputWidget/constants";

class WDSNumberInputWidget extends WDSInputWidget {
  static type = "WDS_NUMBER_INPUT_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      ...super.getConfig(),
      displayOrder: undefined,
      tags: [WIDGET_TAGS.INPUTS],
      name: "Number Input",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      inputType: INPUT_TYPES.NUMBER,
      widgetName: "NumberInput",
    };
  }

  static getMethods() {
    return {
      ...super.getMethods(),
      IconCmp: NumberInputIcon,
      ThumbnailCmp: NumberInputThumbnail,
    };
  }
}

export { WDSNumberInputWidget };
