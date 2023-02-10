import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Audio",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["mp3", "sound", "wave", "player"],
  defaults: {
    rows: 4,
    columns: 28,
    widgetName: "Audio",
    url: "https://assets.appsmith.com/widgets/birds_chirping.mp3",
    autoPlay: false,
    version: 1,
    animateLoading: true,
    responsiveBehavior: getDefaultResponsiveBehavior(Widget.getWidgetType()),
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "70px",
          };
        },
      },
    ],
  },
};

export default Widget;
