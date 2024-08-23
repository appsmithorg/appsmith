import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { InputIcon, InputThumbnail } from "appsmith-icons";
import { INPUT_TYPES } from "widgets/wds/WDSInputWidget/constants";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";

class WDSNumberInputWidget extends WDSInputWidget {
  static type = "WDS_NUMBER_INPUT_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      ...super.getConfig(),
      displayOrder: undefined,
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
      IconCmp: InputIcon,
      ThumbnailCmp: InputThumbnail,
    };
  }
}

export { WDSNumberInputWidget };
