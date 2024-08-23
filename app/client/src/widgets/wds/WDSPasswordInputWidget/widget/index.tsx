import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { InputIcon, InputThumbnail } from "appsmith-icons";
import { INPUT_TYPES } from "widgets/wds/WDSInputWidget/constants";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";

class WDSPasswordInputWidget extends WDSInputWidget {
  static type = "WDS_PASSWORD_INPUT_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      ...super.getConfig(),
      displayOrder: undefined,
      name: "Password Input",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      inputType: INPUT_TYPES.PASSWORD,
      widgetName: "PasswordInput",
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

export { WDSPasswordInputWidget };
