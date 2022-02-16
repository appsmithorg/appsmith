import Widget from "./widget";
import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Audio",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 28,
    widgetName: "Audio",
    url: "https://assets.appsmith.com/widgets/birds_chirping.mp3",
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
