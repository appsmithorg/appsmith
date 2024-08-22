import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { InputIcon, InputThumbnail } from "appsmith-icons";
import { INPUT_TYPES } from "widgets/wds/WDSInputWidget/constants";

class WDSMultilineInputWidget extends WDSInputWidget {
  static type = "WDS_MULTILINE_INPUT_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
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
      IconCmp: InputIcon,
      ThumbnailCmp: InputThumbnail,
    };
  }
}

export { WDSMultilineInputWidget };
