import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { DEFAULT_FONT_SIZE } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { OverflowTypes } from "./constants";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Text",
  iconSVG: IconSVG,
  searchTags: ["typography", "paragraph", "label"],
  defaults: {
    text: "Label",
    fontSize: DEFAULT_FONT_SIZE,
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    rows: 4,
    columns: 16,
    widgetName: "Text",
    shouldTruncate: false,
    overflow: OverflowTypes.NONE,
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
  autoLayout: {
    autoDimension: {
      height: true,
    },
    defaults: {
      columns: 4,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "120px",
            minHeight: "40px",
          };
        },
      },
    ],
    disableResizeHandles: {
      vertical: true,
    },
  },
};

export default Widget;
