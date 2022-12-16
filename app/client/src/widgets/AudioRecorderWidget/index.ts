import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ResponsiveBehavior } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Audio Recorder",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["sound recorder", "voice recorder"],
  defaults: {
    iconColor: "white",
    isDisabled: false,
    isVisible: true,
    rows: 7,
    columns: 16,
    widgetName: "AudioRecorder",
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
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
