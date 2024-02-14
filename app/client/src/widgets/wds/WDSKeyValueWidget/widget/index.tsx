import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WDSInputWidget } from "widgets/wds/WDSInputWidget";

class WDSKeyValueWidget extends WDSInputWidget {
  static type = "WDS_KEY_VALUE_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "KeyValue",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      isReadOnly: true,
      widgetName: "KeyValue",
    };
  }
}

export { WDSKeyValueWidget };
