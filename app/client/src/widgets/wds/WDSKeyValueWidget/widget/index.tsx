import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { KeyValueIcon, KeyValueThumbnail } from "appsmith-icons";

class WDSKeyValueWidget extends WDSInputWidget {
  static type = "WDS_KEY_VALUE_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "KeyValue",
      iconSVG: KeyValueIcon,
      thumbnailSVG: KeyValueThumbnail,
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
