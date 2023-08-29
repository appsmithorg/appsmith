import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/AutoLayout/utils/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 4,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.SELECT],
  needsMeta: true,
  searchTags: ["dropdown"],
  defaults: {
    rows: 7,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    sourceData: [
      { name: "Blue", code: "BLUE" },
      { name: "Green", code: "GREEN" },
      { name: "Red", code: "RED" },
    ],
    optionLabel: "name",
    optionValue: "code",
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    labelTextSize: "0.875rem",
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
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
    setterConfig: Widget.getSetterConfig(),
  },
  methods: {
    getQueryGenerationConfig: (widgetProps: WidgetProps) => {
      return Widget.getQueryGenerationConfig(widgetProps);
    },
    getPropertyUpdatesForQueryBinding: (
      queryConfig: WidgetQueryConfig,
      widget: WidgetProps,
      formConfig: WidgetQueryGenerationFormConfig,
    ) => {
      return Widget.getPropertyUpdatesForQueryBinding(
        queryConfig,
        widget,
        formConfig,
      );
    },
    getSnipingModeUpdates: (
      propValueMap: SnipingModeProperty,
    ): PropertyUpdates[] => {
      return [
        {
          propertyPath: "sourceData",
          propertyValue: propValueMap.data,
          isDynamicPropertyPath: true,
        },
      ];
    },
  },
  autoLayout: {
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
      labelTextSize: "0.875rem",
    },
    defaults: {
      rows: 6.6,
    },
    autoDimension: {
      height: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "120px",
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
