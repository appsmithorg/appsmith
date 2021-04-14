import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  defaults: {
    rows: 7,
    columns: 7,
    widgetName: "Video",
    url: "https://www.youtube.com/watch?v=mzqK0QIZRLs",
    autoPlay: false,
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
