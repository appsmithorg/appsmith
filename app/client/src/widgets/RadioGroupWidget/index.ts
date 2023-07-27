import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.TOGGLES],
  needsMeta: true,
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      active: true,
    },
  },
  searchTags: ["choice"],
  defaults: {
    rows: 6,
    columns: 20,
    animateLoading: true,
    label: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelTextSize: "0.875rem",
    labelWidth: 5,
    options: [
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ],
    defaultOptionValue: "Y",
    isRequired: false,
    isDisabled: false,
    isInline: true,
    alignment: Alignment.LEFT,
    widgetName: "RadioGroup",
    version: 1,
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
          propertyPath: "options",
          propertyValue: propValueMap.data,
          isDynamicPropertyPath: true,
        },
      ];
    },
  },
  autoLayout: {
    defaults: {
      columns: 14,
      rows: 7,
    },
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
    },
    autoDimension: {
      height: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "240px",
            minHeight: "70px",
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
