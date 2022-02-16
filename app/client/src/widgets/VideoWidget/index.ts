import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 28,
    columns: 24,
    widgetName: "Video",
    url: "https://assets.appsmith.com/widgets/bird.mp4",
    autoPlay: false,
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
    isSnipable: true,
    snipableProperty: "url",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.DATA,
  },
};

export default Widget;
