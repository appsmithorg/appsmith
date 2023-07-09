import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { DEFAULT_FONT_SIZE } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { OverflowTypes } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { DynamicHeight } from "utils/WidgetFeatures";
import { BlueprintOperationTypes } from "widgets/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import { get } from "lodash";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";

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
    text: "Hello {{appsmith.user.name || appsmith.user.email}}",
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
    blueprint: {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            if (!isDynamicValue(widget.text)) {
              return [];
            }

            const dynamicBindingPathList: DynamicPath[] = [
              ...get(widget, "dynamicBindingPathList", []),
            ];

            dynamicBindingPathList.push({
              key: "text",
            });

            const updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "dynamicBindingPathList",
                propertyValue: dynamicBindingPathList,
              },
            ];

            return updatePropertyMap;
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
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
    setterConfig: Widget.getSetterConfig(),
  },
  autoLayout: {
    autoDimension: {
      height: true,
    },
    disabledPropsDefaults: {
      overflow: OverflowTypes.NONE,
      dynamicHeight: DynamicHeight.AUTO_HEIGHT,
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
