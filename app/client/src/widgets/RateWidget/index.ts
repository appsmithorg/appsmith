import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { RateWidgetProps } from "./widget";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

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
  tags: [WIDGET_TAGS.CONTENT],
  needsMeta: true,
  searchTags: ["stars", "rate"],
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
  autoLayout: {
    disabledPropsDefaults: {
      size: "LARGE",
    },
    defaults: {
      columns: 7.272727,
      rows: 4,
    },
    autoDimension: {
      width: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: (props: RateWidgetProps) => {
          let maxCount = props.maxCount;
          if (typeof maxCount !== "number")
            maxCount = parseInt(props.maxCount as any, 10);
          return {
            // 21 is the size of a star, 5 is the margin between stars
            minWidth: `${maxCount * 21 + (maxCount + 1) * 5}px`,
            minHeight: "40px",
          };
        },
      },
    ],
    disableResizeHandles: {
      horizontal: true,
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
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
    setterConfig: Widget.getSetterConfig(),
  },
  methods: {
    getSnipingModeUpdates: (
      propValueMap: SnipingModeProperty,
    ): PropertyUpdates[] => {
      return [
        {
          propertyPath: "onRateChanged",
          propertyValue: propValueMap.run,
          isDynamicPropertyPath: true,
        },
      ];
    },
  },
};

export default Widget;
