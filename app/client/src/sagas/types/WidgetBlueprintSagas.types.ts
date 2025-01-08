import type { WidgetProps } from "../../widgets/BaseWidget";
import type { FlattenedWidgetProps } from "../../reducers/types/canvasWidgets.types";
import type { LayoutSystemTypes } from "../../layoutSystems/types";
import type { ActionData } from "../../ee/reducers/entityReducers/actionsReducer";
import type { Action, PluginPackageName } from "../../entities/Action";

export interface UpdatePropertyArgs {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
}

export type BlueprintOperationAddActionFn = (
  widget: WidgetProps & { children?: WidgetProps[] },
) => Generator;

export type BlueprintOperationModifyPropsFn = (
  widget: WidgetProps & { children?: WidgetProps[] },
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  parent?: WidgetProps,
  layoutSystemType?: LayoutSystemTypes,
  addActionResult?: ActionData,
) => UpdatePropertyArgs[] | undefined;

export interface ChildOperationFnResponse {
  widgets: Record<string, FlattenedWidgetProps>;
  message?: string;
}

export interface BlueprintOperationActionPayload {
  pluginPackageName: PluginPackageName;
  actionConfig: Action;
  datasourceName?: string;
}
