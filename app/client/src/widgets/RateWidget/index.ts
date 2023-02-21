import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget, { RateWidgetProps } from "./widget";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 1,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Rating",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["stars"],
  defaults: {
    rows: 4,
    columns: 20,
    animateLoading: true,
    maxCount: 5,
    defaultRate: 3,
    activeColor: Colors.RATE_ACTIVE,
    inactiveColor: Colors.ALTO2,
    size: "LARGE",
    isRequired: false,
    isAllowHalf: false,
    isDisabled: false,
    isReadOnly: false,
    tooltips: ["Terrible", "Bad", "Neutral", "Good", "Great"],
    widgetName: "Rating",
  },
  // A sample widgetSize configuration for AutoLayout
  widgetSize: [
    {
      viewportMinWidth: 0,
      configuration: (props: RateWidgetProps) => {
        return {
          // 20 is the size of a star, 5 is the margin between stars, 8 is the total padding of the widget
          minWidth: `${props.maxCount * 21 + (props.maxCount + 1) * 5 + 8}px`,
        };
      },
    },
  ],
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
