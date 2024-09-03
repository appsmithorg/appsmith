import { get } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  text: "The important thing is not to stop questioning. Curiosity has its reason for existence. One cannot help but be in awe when one contemplates the mysteries of eternity, life, and the marvelous structure of reality. It is enough if one merely tries to comprehend a little of this mystery each day.",
  fontSize: "body",
  textAlign: "left",
  textColor: "neutral",
  fontStyle: undefined,
  widgetName: "Paragraph",
  shouldTruncate: false,
  version: 1,
  animateLoading: true,
  isVisible: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
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
} as unknown as WidgetDefaultProps;
