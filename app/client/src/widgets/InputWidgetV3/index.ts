import { LabelPosition } from "components/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";

import IconSVG from "./icon.svg";
import { InputWidget } from "./widget";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: InputWidget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.INPUTS],
  needsMeta: true,
  searchTags: ["form", "text input", "number", "textarea"],
  defaults: {
    ...BaseConfig.defaults,
    rows: 7,
    labelPosition: LabelPosition.Top,
    inputType: "TEXT",
    widgetName: "Input",
    version: 2,
    showStepArrows: false,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: InputWidget.getDerivedPropertiesMap(),
    default: InputWidget.getDefaultPropertiesMap(),
    meta: InputWidget.getMetaPropertiesMap(),
    config: InputWidget.getPropertyPaneConfig(),
    contentConfig: InputWidget.getPropertyPaneContentConfig(),
    styleConfig: InputWidget.getPropertyPaneStyleConfig(),
    stylesheetConfig: InputWidget.getStylesheetConfig(),
    autocompleteDefinitions: InputWidget.getAutocompleteDefinitions(),
    setterConfig: InputWidget.getSetterConfig(),
  },
  methods: {
    getSnipingModeUpdates: (
      propValueMap: SnipingModeProperty,
    ): PropertyUpdates[] => {
      return [
        {
          propertyPath: "defaultText",
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
    autoDimension: (props: BaseInputWidgetProps) => ({
      height: props.inputType !== "MULTI_LINE_TEXT",
    }),
    defaults: {
      rows: 6.6,
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
    disableResizeHandles: (props: BaseInputWidgetProps) => ({
      vertical: props.inputType !== "MULTI_LINE_TEXT",
    }),
  },
};

export { InputWidget };
