import { promisify } from "./utils/Promisify";

import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  canvasWidgets,
  dataTreeEvaluator,
  canvasWidgetsMeta,
  metaWidgetsCache,
} from "../handlers/evalTree";
import _ from "lodash";
import type {
  WidgetEntityConfig,
  WidgetEntity,
} from "ee/entities/DataTree/types";
import { isWidget } from "ee/workers/Evaluation/evaluationUtils";
import { klona } from "klona";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import { evaluateSync, setEvalContext } from "../evaluate";
import type { DescendantWidgetMap } from "sagas/WidgetOperationUtils";
import type { MetaState } from "reducers/entityReducers/metaReducer/index.types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer.types";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { validateAndParseWidgetProperty } from "workers/common/DataTreeEvaluator/validationUtils";

function resetWidgetFnDescriptor(
  widgetName: string,
  resetChildren = true,
  metaUpdates: EvalMetaUpdates,
) {
  return {
    type: "RESET_WIDGET_META_RECURSIVE_BY_NAME" as const,
    payload: { widgetName, resetChildren, metaUpdates },
  };
}

export type TResetWidgetDescription = ReturnType<
  typeof resetWidgetFnDescriptor
>;
export type TResetWidgetActionType = TResetWidgetDescription["type"];

async function resetWidget(
  ...args: [widgetName: string, resetChildren: boolean]
) {
  const widgetName = args[0];
  const resetChildren = args[1];
  const metaUpdates: EvalMetaUpdates = [];
  const updatedProperties: string[][] = [];

  resetWidgetMetaProperty(
    widgetName,
    resetChildren,
    metaUpdates,
    updatedProperties,
  );

  return promisify(resetWidgetFnDescriptor)(
    widgetName,
    resetChildren,
    metaUpdates,
  );
}

function resetWidgetMetaProperty(
  widgetName: string,
  resetChildren = true,
  evalMetaUpdates: EvalMetaUpdates,
  updatedProperties: string[][],
) {
  if (!dataTreeEvaluator) return;

  let widget: FlattenedWidgetProps | undefined = _.find(
    Object.values(canvasWidgets || {}),
    (widget) => widget.widgetName === widgetName,
  );

  if (!widget) {
    widget = _.find(
      Object.values(metaWidgetsCache || {}),
      (widget) => widget.widgetName === widgetName,
    );
  }

  if (!widget) return;

  const evalTree = dataTreeEvaluator.getEvalTree();
  const oldUnEvalTree = dataTreeEvaluator.getOldUnevalTree();
  const configTree = dataTreeEvaluator.getConfigTree();
  const evalProps = dataTreeEvaluator.getEvalProps();

  const evaluatedEntity = evalTree[widget.widgetName];
  const evaluatedEntityConfig = configTree[
    widget.widgetName
  ] as WidgetEntityConfig;

  if (evaluatedEntity && isWidget(evaluatedEntity)) {
    const metaObj = evaluatedEntity.meta;
    const currentMetaProperties = Object.keys(metaObj);
    const { propertyOverrideDependency } = evaluatedEntityConfig;

    for (const propertyPath of currentMetaProperties) {
      const defaultPropertyPath =
        propertyOverrideDependency[propertyPath]?.DEFAULT;

      if (defaultPropertyPath) {
        const unEvalEntity = oldUnEvalTree[widget.widgetName] as WidgetEntity;
        const expressionToEvaluate: string = unEvalEntity[defaultPropertyPath];

        let finalValue: unknown;

        if (
          expressionToEvaluate &&
          typeof expressionToEvaluate === "string" &&
          isDynamicValue(expressionToEvaluate)
        ) {
          const { jsSnippets } = getDynamicBindings(expressionToEvaluate);
          const { result } = evaluateSync(
            jsSnippets[0] || expressionToEvaluate,
            evalTree,
            false,
            {},
            undefined,
            configTree,
          );

          finalValue = klona(result);
        } else {
          finalValue = klona(expressionToEvaluate);
        }

        // Switch back to async evaluation once done with sync tasks.
        setEvalContext({
          dataTree: evalTree,
          configTree: dataTreeEvaluator.getConfigTree(),
          isDataField: false,
          isTriggerBased: true,
        });

        const parsedValue = validateAndParseWidgetProperty({
          fullPropertyPath: `${widget.widgetName}.${defaultPropertyPath}`,
          widget: unEvalEntity,
          configTree,
          evalPropertyValue: finalValue,
          unEvalPropertyValue: expressionToEvaluate,
          evalProps,
        });

        evalMetaUpdates.push({
          widgetId: evaluatedEntity.isMetaWidget
            ? (evaluatedEntity.metaWidgetId as string)
            : evaluatedEntity.widgetId,
          metaPropertyPath: propertyPath.split("."),
          value: parsedValue,
        });

        continue;
      } else {
        evalMetaUpdates.push({
          widgetId: evaluatedEntity.isMetaWidget
            ? (evaluatedEntity.metaWidgetId as string)
            : evaluatedEntity.widgetId,
          metaPropertyPath: propertyPath.split("."),
          value: undefined,
        });
      }
    }

    if (resetChildren) {
      resetChildrenMetaProperty(
        widget.widgetId,
        evalTree,
        evalMetaUpdates,
        updatedProperties,
      );
    }
  }
}

function sortWidgetsMetaByParent(widgetsMeta: MetaState, parentId: string) {
  return _.reduce(
    widgetsMeta,
    function (
      result: {
        childrenWidgetsMeta: MetaState;
        otherWidgetsMeta: MetaState;
      },
      currentWidgetMeta,
      key,
    ) {
      return key.startsWith(parentId + "_")
        ? {
            ...result,
            childrenWidgetsMeta: {
              ...result.childrenWidgetsMeta,
              [key]: currentWidgetMeta,
            },
          }
        : {
            ...result,
            otherWidgetsMeta: {
              ...result.otherWidgetsMeta,
              [key]: currentWidgetMeta,
            },
          };
    },
    {
      childrenWidgetsMeta: {},
      otherWidgetsMeta: {},
    },
  );
}

export function getWidgetDescendantToReset(
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  evaluatedDataTree: DataTree,
  widgetsMeta: MetaState,
): DescendantWidgetMap[] {
  const descendantList: DescendantWidgetMap[] = [];
  const widget = _.get(canvasWidgets, widgetId);

  const sortedWidgetsMeta = sortWidgetsMetaByParent(widgetsMeta, widgetId);

  for (const childMetaWidgetId of Object.keys(
    sortedWidgetsMeta.childrenWidgetsMeta,
  )) {
    const evaluatedChildWidget = _.find(evaluatedDataTree, function (entity) {
      return isWidget(entity) && entity.widgetId === childMetaWidgetId;
    }) as WidgetEntity | undefined;

    descendantList.push({
      id: childMetaWidgetId,
      evaluatedWidget: evaluatedChildWidget,
    });
    const grandChildren = getWidgetDescendantToReset(
      canvasWidgets,
      childMetaWidgetId,
      evaluatedDataTree,
      sortedWidgetsMeta.otherWidgetsMeta,
    );

    if (grandChildren.length) {
      descendantList.push(...grandChildren);
    }
  }

  if (widget) {
    const { children = [] } = widget;

    if (children && children.length) {
      for (const childIndex in children) {
        if (children.hasOwnProperty(childIndex)) {
          const childWidgetId = children[childIndex];

          const childCanvasWidget = _.get(canvasWidgets, childWidgetId);
          const childWidgetName = childCanvasWidget.widgetName;
          const childWidget = evaluatedDataTree[childWidgetName];

          if (isWidget(childWidget)) {
            descendantList.push({
              id: childWidgetId,
              evaluatedWidget: childWidget,
            });
            const grandChildren = getWidgetDescendantToReset(
              canvasWidgets,
              childWidgetId,
              evaluatedDataTree,
              sortedWidgetsMeta.otherWidgetsMeta,
            );

            if (grandChildren.length) {
              descendantList.push(...grandChildren);
            }
          }
        }
      }
    }
  }

  return descendantList;
}

function resetChildrenMetaProperty(
  parentWidgetId: string,
  evaluatedDataTree: DataTree,
  evalMetaUpdates: EvalMetaUpdates,
  updatedProperties: string[][],
) {
  const childrenList = getWidgetDescendantToReset(
    canvasWidgets,
    parentWidgetId,
    evaluatedDataTree,
    canvasWidgetsMeta,
  );

  for (const childIndex in childrenList) {
    const { evaluatedWidget: childWidget } = childrenList[childIndex];

    if (!childWidget) continue;

    resetWidgetMetaProperty(
      childWidget?.widgetName,
      false,
      evalMetaUpdates,
      updatedProperties,
    );
  }
}

export default resetWidget;
