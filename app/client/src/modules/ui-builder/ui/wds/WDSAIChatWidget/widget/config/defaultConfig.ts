import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import {
  BlueprintOperationTypes,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";
import { createOrUpdateDataSourceWithAction } from "sagas/DatasourcesSagas";
import { PluginPackageName } from "entities/Action";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type { WidgetProps } from "widgets/BaseWidget";

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
        fn: function* (widget: WidgetProps & { children?: WidgetProps[] }) {
          const action: ActionData = yield createOrUpdateDataSourceWithAction(
            PluginPackageName.APPSMITH_AI,
            {
              usecase: { data: "TEXT_CLASSIFY" },
            },
          );

          return [
            {
              widgetId: widget.widgetId,
              propertyName: "query",
              propertyValue: action.config.name,
            },
          ];
        },
      },
    ],
  },
} as unknown as WidgetDefaultProps;
