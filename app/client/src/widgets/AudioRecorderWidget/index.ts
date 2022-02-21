import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Audio Recorder",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    backgroundColor: "#F86A2B",
    iconColor: "white",
    isDisabled: false,
    isVisible: true,
    rows: 8,
    columns: 16,
    widgetName: "AudioRecorder",
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
