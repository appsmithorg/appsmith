import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Iframe",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    source: "https://www.example.com",
    borderOpacity: 100,
    borderWidth: 1,
    rows: 32,
    columns: 24,
    widgetName: "Iframe",
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
