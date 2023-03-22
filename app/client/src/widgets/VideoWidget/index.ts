import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["youtube"],
  defaults: {
    rows: 28,
    columns: 24,
    widgetName: "Video",
    url: "https://assets.appsmith.com/widgets/bird.mp4",
    autoPlay: false,
    version: 1,
    animateLoading: true,
    backgroundColor: "#000",
    responsiveBehavior: ResponsiveBehavior.Fill,
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
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "300px",
          };
        },
      },
    ],
  },
};

export default Widget;
