import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import {
  BlueprintOperationTypes,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";
import { createOrUpdateDataSourceWithAction } from "sagas/DatasourcesSagas";
import { PluginPackageName } from "entities/Action";

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
        fn: function* () {
          yield createOrUpdateDataSourceWithAction(
            PluginPackageName.APPSMITH_AI,
            {
              usecase: { data: "TEXT_CLASSIFY" },
            },
          );
        },
      },
    ],
  },
} as unknown as WidgetDefaultProps;
