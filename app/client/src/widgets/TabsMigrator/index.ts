import Widget from "./widget";
import { SnipablePropertyValueType } from "../BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "TabsMigrator",
  needsMeta: true,

  defaults: {
    isLoading: true,
    rows: 1,
    columns: 1,
    widgetName: "Skeleton",
    version: 1,
    animateLoading: true,
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
