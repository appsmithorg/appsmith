import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { Positioning } from "utils/autoLayout/constants";
import { GridDefaults } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";

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
  name: "Stats Box",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
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
  defaults: {
    rows: 14,
    columns: 22,
    animateLoading: true,
    widgetName: "Statbox",
    backgroundColor: "white",
    borderWidth: "1",
    borderColor: Colors.GREY_5,
    minDynamicHeight: 14,
    children: [],
    positioning: Positioning.Fixed,
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
            version: 1,
            blueprint: {
              view: [
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: { top: 0, left: 1 },
                  props: {
                    text: "Page Views",
                    fontSize: "0.875rem",
                    textColor: "#999999",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: {
                    top: 4,
                    left: 1,
                  },
                  props: {
                    text: "2.6 M",
                    fontSize: "1.25rem",
                    fontStyle: "BOLD",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 36,
                  },
                  position: {
                    top: 8,
                    left: 1,
                  },
                  props: {
                    text: "21% more than last month",
                    fontSize: "0.875rem",
                    textColor: Colors.GREEN,
                    version: 1,
                  },
                },
                {
                  type: "ICON_BUTTON_WIDGET",
                  size: {
                    rows: 8,
                    cols: 16,
                  },
                  position: {
                    top: 2,
                    left: 46,
                  },
                  props: {
                    iconName: "arrow-top-right",
                    buttonStyle: "PRIMARY",
                    buttonVariant: ButtonVariantTypes.PRIMARY,
                    version: 1,
                  },
                },
              ],
            },
          },
        },
      ],
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
