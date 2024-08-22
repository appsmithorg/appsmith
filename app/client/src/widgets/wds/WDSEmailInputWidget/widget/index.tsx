import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { InputIcon, InputThumbnail } from "appsmith-icons";
import { INPUT_TYPES } from "widgets/wds/WDSInputWidget/constants";

class WDSEmailInputWidget extends WDSInputWidget {
  static type = "WDS_EMAIL_INPUT_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "Email Input",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      inputType: INPUT_TYPES.EMAIL,
      widgetName: "EmailInput",
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

export { WDSEmailInputWidget };
