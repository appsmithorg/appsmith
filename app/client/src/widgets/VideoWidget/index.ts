import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { SnipablePropertyValueType } from "../BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7 * GRID_DENSITY_MIGRATION_V1,
    columns: 6 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Video",
    url: "https://assets.appsmith.com/widgets/bird.mp4",
    autoPlay: false,
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
    isSnipable: true,
    snipableProperty: "url",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.DATA,
  },
};

export default Widget;
