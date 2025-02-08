import { WIDGET_TAGS } from "constants/WidgetConstants";
import { WDSInputWidget } from "modules/ui-builder/ui/wds/WDSInputWidget";
import { KeyValueIcon, KeyValueThumbnail } from "appsmith-icons";
import type { WidgetBaseConfiguration } from "WidgetProvider/constants";

class WDSKeyValueWidget extends WDSInputWidget {
  static type = "WDS_KEY_VALUE_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      ...super.getConfig(),
      displayOrder: undefined,
      tags: [WIDGET_TAGS.DISPLAY],
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
