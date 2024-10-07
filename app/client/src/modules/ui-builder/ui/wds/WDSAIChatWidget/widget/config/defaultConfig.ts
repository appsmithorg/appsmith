import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import {
  BlueprintOperationTypes,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";

export const defaultsConfig = {
  isVisible: true,
  widgetName: "AIChat",
  widgetType: "AI_CHAT",
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Fill,
  initialAssistantMessage: "",
  initialAssistantSuggestions: [],
  blueprint: {
    operations: [
      {
        type: BlueprintOperationTypes.ADD_ACTION,
        fn: () => {},
      },
    ],
  },
} as unknown as WidgetDefaultProps;
