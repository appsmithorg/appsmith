import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Stats Box",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 14,
    columns: 16,
    animateLoading: true,
    widgetName: "Statbox",
    backgroundColor: "white",
    borderWidth: "1",
    borderColor: Colors.GREY_5,
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
                    fontSize: "0.75rem",
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
                    fontSize: THEMEING_TEXT_SIZES.lg,
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
                    fontSize: "0.75rem",
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
  },
};

export default Widget;
