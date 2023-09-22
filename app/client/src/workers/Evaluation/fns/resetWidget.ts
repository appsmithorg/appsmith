import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  canvasWidgets,
  dataTreeEvaluator,
  canvasWidgetsMeta,
} from "../handlers/evalTree";
import _ from "lodash";
import type {
  DataTree,
  UnEvalTree,
  UnEvalTreeEntity,
  WidgetEntityConfig,
  WidgetEntity,
} from "entities/DataTree/dataTreeFactory";
import {
  isWidget,
  overrideWidgetProperties,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { klona } from "klona";
import type { PropertyOverrideDependency } from "entities/DataTree/types";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import { evaluateAsync } from "../evaluate";
import type { DescendantWidgetMap } from "sagas/WidgetOperationUtils";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "../evalTreeWithChanges";

function resetWidgetFnDescriptor(widgetName: string, resetChildren: boolean) {
  return {
    type: "RESET_WIDGET_META_RECURSIVE_BY_NAME" as const,
    payload: { widgetName, resetChildren },
  };
}

export type TResetWidgetArgs = Parameters<typeof resetWidgetFnDescriptor>;
export type TResetWidgetDescription = ReturnType<
  typeof resetWidgetFnDescriptor
>;
export type TResetWidgetActionType = TResetWidgetDescription["type"];

async function resetWidget(
  ...args: Parameters<typeof resetWidgetFnDescriptor>
) {
  const widgetName = args[0];
  const resetChildren = args[1] || true;
  const metaUpdates: EvalMetaUpdates = [];
  const updatedProperties: string[][] = [];

  await resetWidgetMetaProperty(
    widgetName,
    resetChildren,
    metaUpdates,
    updatedProperties,
  );

  evalTreeWithChanges(updatedProperties, metaUpdates);

  // return promisify(resetWidgetFnDescriptor)(...args);
}

async function resetWidgetMetaProperty(
  widgetName: string,
  resetChildren = true,
  evalMetaUpdates: EvalMetaUpdates,
  updatedProperties: string[][],
) {
  const widget: FlattenedWidgetProps | undefined = _.find(
    Object.values(canvasWidgets),
    (widget) => widget.widgetName === widgetName,
  );
  const evalTree = dataTreeEvaluator?.getEvalTree() || {};
  const oldUnEvalTree = dataTreeEvaluator?.getOldUnevalTree() || {};
  const configTree = dataTreeEvaluator?.getConfigTree() || {};

  if (widget) {
    const evaluatedEntity = evalTree[widget.widgetName];
    const evaluatedEntityConfig = configTree[
      widget.widgetName
    ] as WidgetEntityConfig;

    const unEvalEntity = oldUnEvalTree[widget.widgetName] as UnEvalTree;

    if (isWidget(evaluatedEntity)) {
      if (evaluatedEntity) {
        const { propertyOverrideDependency } = evaluatedEntityConfig;
        // propertyOverrideDependency has defaultProperty name for each meta property of widget
        const propertyOverrideDependencyEntries = Object.entries(
          propertyOverrideDependency as PropertyOverrideDependency,
        );

        for (let i = 0; i < propertyOverrideDependencyEntries.length; i++) {
          const [propertyPath, dependency] =
            propertyOverrideDependencyEntries[i];
          const defaultPropertyPath = dependency.DEFAULT;

          if (!defaultPropertyPath) continue;

          const expressionToEvaluate: string | UnEvalTreeEntity | undefined =
            defaultPropertyPath && unEvalEntity[defaultPropertyPath];

          let finalValue: unknown;
          if (
            expressionToEvaluate &&
            typeof expressionToEvaluate === "string" &&
            isDynamicValue(expressionToEvaluate)
          ) {
            const { jsSnippets } = getDynamicBindings(expressionToEvaluate);
            const { result } = await evaluateAsync(
              jsSnippets[0] || expressionToEvaluate,
              evalTree,
              configTree,
              {},
              undefined,
            );

            finalValue = klona(result);
          } else {
            finalValue = klona(expressionToEvaluate);
          }

          const overriddenProperties: string[] = [];

          overrideWidgetProperties({
            entity: evaluatedEntity,
            propertyPath: defaultPropertyPath,
            value: finalValue,
            currentTree: evalTree,
            configTree,
            evalMetaUpdates,
            fullPropertyPath: `${widgetName}.${propertyPath}`,
            isNewWidget: false,
            shouldUpdateGlobalContext: true,
            overriddenProperties,
          });

          overriddenProperties.forEach((propPath) => {
            updatedProperties.push([widgetName, propPath]);
          });

          updatedProperties.push(
            [widgetName, propertyPath],
            [widgetName, defaultPropertyPath],
          );
          evalMetaUpdates.push({
            widgetId: evaluatedEntity.widgetId,
            metaPropertyPath: propertyPath.split("."),
            value: finalValue,
          });
        }
      }

      if (resetChildren) {
        await resetChildrenMetaProperty(
          widget.widgetId,
          evalTree,
          evalMetaUpdates,
          updatedProperties,
        );
      }
    }
  }
}

export default resetWidget;

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
      true,
      evalMetaUpdates,
      updatedProperties,
    );
  }
}
