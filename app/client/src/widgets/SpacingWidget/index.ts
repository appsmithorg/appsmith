import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Spacing", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "Spacing",
    rows: 4,
    columns: 4,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    config: Widget.getPropertyPaneConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
