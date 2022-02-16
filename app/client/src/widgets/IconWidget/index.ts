import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Icon",
  iconSVG: IconSVG,
  hideCard: true,
  defaults: {
    widgetName: "Icon",
    rows: 4,
    columns: 4,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
  sniping: {
    widgetType: Widget.getWidgetType(),
    isSnipable: false,
    snipableProperty: "",
    shouldSetPropertyInputToJsMode: false,
    snipablePropertyValueType: SnipablePropertyValueType.NONE,
  },
};

export default Widget;
