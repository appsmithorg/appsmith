import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { DEFAULT_FONT_SIZE } from "constants/WidgetConstants";
import { OverflowTypes } from "widgets/TextWidget/constants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { get } from "lodash";

export const defaultsConfig = {
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
};
