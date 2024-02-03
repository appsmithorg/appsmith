import { WDSInputWidget } from "widgets/wds/WDSInputWidget";

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
}

export { WDSKeyValueWidget };
