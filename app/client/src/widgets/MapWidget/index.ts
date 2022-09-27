import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ResponsiveBehavior } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Map",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 40,
    columns: 24,
    isDisabled: false,
    isVisible: true,
    widgetName: "Map",
    enableSearch: true,
    zoomLevel: 50,
    enablePickLocation: true,
    allowZoom: true,
    mapCenter: { lat: 25.122, long: 50.132 },
    defaultMarkers: [{ lat: 25.122, long: 50.132, title: "Location1" }],
    isClickedMarkerCentered: true,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
