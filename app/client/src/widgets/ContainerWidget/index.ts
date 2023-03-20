import { ButtonBoxShadowTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults, WidgetHeightLimits } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Container",
  iconSVG: IconSVG,
  isCanvas: true,
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  canvasHeightOffset: (props: WidgetProps): number => {
    const offset =
      props.borderWidth && props.borderWidth > 1
        ? Math.ceil(
            (2 * parseInt(props.borderWidth, 10) || 0) /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          )
        : 0;

    return offset;
  },
  searchTags: ["div", "parent", "group"],
  defaults: {
    backgroundColor: "#FFFFFF",
    rows: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
    columns: 24,
    widgetName: "Container",
    containerStyle: "card",
    borderColor: Colors.GREY_5,
    borderWidth: "1",
    boxShadow: ButtonBoxShadowTypes.NONE,
    animateLoading: true,
    children: [],
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        },
      ],
    },
    version: 1,
    // positioning: Positioning.Vertical,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "50px",
          };
        },
      },
    ],
    disableResizeHandles: {
      vertical: true,
    },
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
