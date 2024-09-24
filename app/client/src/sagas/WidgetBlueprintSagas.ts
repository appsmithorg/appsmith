import type { WidgetBlueprint } from "WidgetProvider/constants";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import { call, select } from "redux-saga/effects";
import { get } from "lodash";
import WidgetFactory from "WidgetProvider/factory";

import type { WidgetType } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import * as log from "loglevel";
import { toast } from "@appsmith/ads";
import type { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

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
        log.error(e);
      }
    }
  }

  return children;
}

export function* buildWidgetBlueprint(
  blueprint: WidgetBlueprint,
  widgetId: string,
) {
  const widgetProps: Record<string, unknown> = yield call(
    buildView,
    blueprint.view,
    widgetId,
  );

  return widgetProps;
}

export interface UpdatePropertyArgs {
  widgetId: string;
  propertyName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any;
}
export type BlueprintOperationAddActionFn = () => void;
export type BlueprintOperationModifyPropsFn = (
  widget: WidgetProps & { children?: WidgetProps[] },
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  parent?: WidgetProps,
  layoutSystemType?: LayoutSystemTypes,
) => UpdatePropertyArgs[] | undefined;

export interface ChildOperationFnResponse {
  widgets: Record<string, FlattenedWidgetProps>;
  message?: string;
}

export type BlueprintOperationChildOperationsFn = (
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
  parentId: string,
  widgetPropertyMaps: {
    defaultPropertyMap: Record<string, string>;
  },
  layoutSystemType: LayoutSystemTypes,
) => ChildOperationFnResponse;

export type BlueprintBeforeOperationsFn = (
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
  parentId: string,
  layoutSystemType: LayoutSystemTypes,
) => void;

export type BlueprintOperationFunction =
  | BlueprintOperationModifyPropsFn
  | BlueprintOperationAddActionFn
  | BlueprintOperationChildOperationsFn
  | BlueprintBeforeOperationsFn;

export type BlueprintOperationType = keyof typeof BlueprintOperationTypes;

export interface BlueprintOperation {
  type: BlueprintOperationType;
  fn: BlueprintOperationFunction;
}

export function* executeWidgetBlueprintOperations(
  operations: BlueprintOperation[],
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
) {
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  operations.forEach((operation: BlueprintOperation) => {
    const widget: WidgetProps & { children?: string[] | WidgetProps[] } = {
      ...widgets[widgetId],
    };

    switch (operation.type) {
      case BlueprintOperationTypes.MODIFY_PROPS:
        if (widget.children && widget.children.length > 0) {
          widget.children = (widget.children as string[]).map(
            (childId: string) => widgets[childId],
          ) as WidgetProps[];
        }

        const updatePropertyPayloads: UpdatePropertyArgs[] | undefined = (
          operation.fn as BlueprintOperationModifyPropsFn
        )(
          widget as WidgetProps & { children?: WidgetProps[] },
          widgets,
          get(widgets, widget.parentId || "", undefined),
          layoutSystemType,
        );

        updatePropertyPayloads &&
          updatePropertyPayloads.forEach((params: UpdatePropertyArgs) => {
            widgets[params.widgetId][params.propertyName] =
              params.propertyValue;
          });
        break;
    }
  });

  const result: { [widgetId: string]: FlattenedWidgetProps } = yield widgets;

  return result;
}

/**
 * this saga executes the blueprint child operation
 *
 * @param parent
 * @param newWidgetId
 * @param widgets
 *
 * @returns { [widgetId: string]: FlattenedWidgetProps }
 */
export function* executeWidgetBlueprintChildOperations(
  operation: BlueprintOperation,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetIds: string[],
  parentId: string,
) {
  // TODO(abhinav): Special handling for child operaionts
  // This needs to be deprecated soon

  let widgets = canvasWidgets,
    message;
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  for (const widgetId of widgetIds) {
    // Get the default properties map of the current widget
    // The operation can handle things based on this map
    // Little abstraction leak, but will be deprecated soon
    const widgetPropertyMaps = {
      defaultPropertyMap: WidgetFactory.getWidgetDefaultPropertiesMap(
        canvasWidgets[widgetId].type as WidgetType,
      ),
    };

    let currMessage;

    ({ message: currMessage, widgets } = (
      operation.fn as BlueprintOperationChildOperationsFn
    )(widgets, widgetId, parentId, widgetPropertyMaps, layoutSystemType));

    //set message if one of the widget has any message to show
    if (currMessage) message = currMessage;
  }

  // If something odd happens show the message related to the odd scenario
  if (message) {
    toast.show(message, {
      kind: "info",
    });
  }

  // Flow returns to the usual from here.
  return widgets;
}

/**
 * this saga traverse the tree till we get
 * to MAIN_CONTAINER_WIDGET_ID while travesring, if we find
 * any widget which has CHILD_OPERATION, we will call the fn in it
 *
 * @param parent
 * @param newWidgetId
 * @param widgets
 *
 * @returns { [widgetId: string]: FlattenedWidgetProps }
 */
export function* traverseTreeAndExecuteBlueprintChildOperations(
  parent: FlattenedWidgetProps,
  newWidgetIds: string[],
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  let root = parent;

  while (root.parentId && root.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    const parentConfig = WidgetFactory.widgetConfigMap.get(root.type);

    // find the blueprint with type CHILD_OPERATIONS
    const blueprintChildOperation = get(
      parentConfig,
      "blueprint.operations",
      [],
    ).find(
      (operation: BlueprintOperation) =>
        operation.type === BlueprintOperationTypes.CHILD_OPERATIONS,
    );

    // if there is blueprint operation with CHILD_OPERATION type, call the fn in it
    if (blueprintChildOperation) {
      const updatedWidgets:
        | { [widgetId: string]: FlattenedWidgetProps }
        | undefined = yield call(
        executeWidgetBlueprintChildOperations,
        blueprintChildOperation,
        widgets,
        newWidgetIds,
        root.widgetId,
      );

      if (updatedWidgets) {
        widgets = updatedWidgets;
      }
    }

    root = widgets[root.parentId];
  }

  return widgets;
}

interface ExecuteWidgetBlueprintBeforeOperationsParams {
  parentId: string;
  widgetId: string;
  widgets: { [widgetId: string]: FlattenedWidgetProps };
  widgetType: WidgetType;
}

export function* executeWidgetBlueprintBeforeOperations(
  blueprintOperation: Extract<
    BlueprintOperationTypes,
    | BlueprintOperationTypes.BEFORE_ADD
    | BlueprintOperationTypes.BEFORE_DROP
    | BlueprintOperationTypes.BEFORE_PASTE
    | BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD
  >,
  params: ExecuteWidgetBlueprintBeforeOperationsParams,
) {
  const { parentId, widgetId, widgets, widgetType } = params;
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  const blueprintOperations: BlueprintOperation[] =
    WidgetFactory.widgetConfigMap.get(widgetType)?.blueprint?.operations ?? [];

  const beforeAddOperation = blueprintOperations.find(
    (operation) => operation.type === blueprintOperation,
  );

  if (beforeAddOperation)
    return (beforeAddOperation.fn as BlueprintBeforeOperationsFn)(
      widgets,
      widgetId,
      parentId,
      layoutSystemType,
    );
}
