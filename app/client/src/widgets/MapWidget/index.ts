import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Map",
  iconSVG: IconSVG,
  defaults: {
    rows: 12,
    columns: 8,
    isDisabled: false,
    isVisible: true,
    widgetName: "Map",
    enableSearch: true,
    zoomLevel: 50,
    enablePickLocation: true,
    allowZoom: true,
    mapCenter: { lat: -34.397, long: 150.644 },
    defaultMarkers: [{ lat: -34.397, long: 150.644, title: "Test A" }],
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
