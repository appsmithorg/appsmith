import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { KeyValueIcon, KeyValueThumbnail } from "appsmith-icons";

class WDSKeyValueWidget extends WDSInputWidget {
  static type = "WDS_KEY_VALUE_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "KeyValue",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      isReadOnly: true,
      widgetName: "KeyValue",
    };
  }

  static getMethods() {
    return {
      ...super.getMethods(),
      IconCmp: KeyValueIcon,
      ThumbnailCmp: KeyValueThumbnail,
    };
  }
}

export { WDSKeyValueWidget };
