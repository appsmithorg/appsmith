import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ProgressType } from "./constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Progress", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["percent"],
  defaults: {
    widgetName: "Progress",
    rows: 4,
    columns: 28,
    fillColor: Colors.GREEN,
    isIndeterminate: false,
    showResult: false,
    counterClosewise: false,
    isVisible: true,
    steps: 1,
    progressType: ProgressType.LINEAR,
    progress: 50,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
