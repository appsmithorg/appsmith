import { WidgetBlueprint } from "reducers/entityReducers/widgetConfigReducer";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import { call } from "redux-saga/effects";
import { get } from "lodash";

function buildView(view: WidgetBlueprint["view"], widgetId: string) {
  const children = [];
  if (view) {
    for (const template of view) {
      //TODO(abhinav): Can we keep rows and size mandatory?
      try {
        children.push({
          widgetId,
          type: template.type,
          leftColumn: template.position.left || 0,
          topRow: template.position.top || 0,
          columns: template.size && template.size.cols,
          rows: template.size && template.size.rows,
          newWidgetId: generateReactKey(),
          props: template.props,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  return children;
}

export function* buildWidgetBlueprint(
  blueprint: WidgetBlueprint,
  widgetId: string,
) {
  const widgetProps = yield call(buildView, blueprint.view, widgetId);
  return widgetProps;
}

export type UpdatePropertyArgs = {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
};
export type BlueprintOperationAddActionFn = () => void;
export type BlueprintOperationModifyPropsFn = (
  widget: WidgetProps & { children?: WidgetProps[] },
  parent?: WidgetProps,
) => UpdatePropertyArgs[] | undefined;

export type BlueprintOperationFunction =
  | BlueprintOperationModifyPropsFn
  | BlueprintOperationAddActionFn;

export enum BlueprintOperationTypes {
  MODIFY_PROPS = "MODIFY_PROPS",
  ADD_ACTION = "ADD_ACTION",
}

export type BlueprintOperationType = keyof typeof BlueprintOperationTypes;

export type BlueprintOperation = {
  type: BlueprintOperationType;
  fn: BlueprintOperationFunction;
};

export function* executeWidgetBlueprintOperations(
  operations: BlueprintOperation[],
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
) {
  operations.forEach((operation: BlueprintOperation) => {
    switch (operation.type) {
      case BlueprintOperationTypes.MODIFY_PROPS:
        const widget: WidgetProps & { children?: string[] | WidgetProps[] } = {
          ...widgets[widgetId],
        };
        if (widget.children && widget.children.length > 0) {
          widget.children = (widget.children as string[]).map(
            (childId: string) => widgets[childId],
          ) as WidgetProps[];
        }
        const updatePropertyPayloads:
          | UpdatePropertyArgs[]
          | undefined = (operation.fn as BlueprintOperationModifyPropsFn)(
          widget as WidgetProps & { children?: WidgetProps[] },
          get(widgets, widget.parentId || "", undefined),
        );
        updatePropertyPayloads &&
          updatePropertyPayloads.forEach((params: UpdatePropertyArgs) => {
            widgets[params.widgetId][params.propertyName] =
              params.propertyValue;
          });
    }
  });
  return yield widgets;
}
