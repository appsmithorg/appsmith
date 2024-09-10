import { WIDGET_TAGS } from "constants/WidgetConstants";
import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";
import { INPUT_TYPES } from "widgets/wds/WDSBaseInputWidget/constants";
import { MultilineInputIcon, MultilineInputThumbnail } from "appsmith-icons";

class WDSMultilineInputWidget extends WDSInputWidget {
  static type = "WDS_MULTILINE_INPUT_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      ...super.getConfig(),
      displayOrder: undefined,
      tags: [WIDGET_TAGS.INPUTS],
      name: "Multiline Input",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      inputType: INPUT_TYPES.MULTI_LINE_TEXT,
      widgetName: "MultilineInput",
    };
  }

  static getMethods() {
    return {
      ...super.getMethods(),
      IconCmp: MultilineInputIcon,
      ThumbnailCmp: MultilineInputThumbnail,
    };
  }
}

export { WDSMultilineInputWidget };
