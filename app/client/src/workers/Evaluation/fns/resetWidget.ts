import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  canvasWidgets,
  dataTreeEvaluator,
  canvasWidgetsMeta,
} from "../handlers/evalTree";
import _ from "lodash";
import type {
  DataTree,
  UnEvalTreeEntity,
  WidgetEntityConfig,
  WidgetEntity,
} from "entities/DataTree/dataTreeFactory";
import {
  isWidget,
  overrideWidgetProperties,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { klona } from "klona";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import evaluateSync from "../evaluate";
import type { DescendantWidgetMap } from "sagas/WidgetOperationUtils";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "../evalTreeWithChanges";

async function resetWidget(
  ...args: [widgetName: string, resetChildren: boolean]
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

  if (!dataTreeEvaluator) return;
  if (!widget) return;

  const evalTree = dataTreeEvaluator.getEvalTree();
  const oldUnEvalTree = dataTreeEvaluator.getOldUnevalTree();
  const configTree = dataTreeEvaluator.getConfigTree();

  const evaluatedEntity = evalTree[widget.widgetName];
  const evaluatedEntityConfig = configTree[
    widget.widgetName
  ] as WidgetEntityConfig;

  if (isWidget(evaluatedEntity) && evaluatedEntity) {
    const metaObj = evaluatedEntity.meta;
    const currentMetaProperties = Object.keys(metaObj);
    const { propertyOverrideDependency } = evaluatedEntityConfig;
    /**
     * - Updates all the meta values which does not have a DEFAULT path for example, PhoneInput1.value.
     *
     * - When we set the value to undefined, the evalTreeWithChanges will update the meta value to the
     * default value during evaluations
     */
    for (const propertyPath of currentMetaProperties) {
      const defaultPropertyPath =
        propertyOverrideDependency[propertyPath]?.DEFAULT;
      if (defaultPropertyPath) {
        const unEvalEntity = oldUnEvalTree[widget.widgetName] as WidgetEntity;
        const expressionToEvaluate: string | UnEvalTreeEntity | undefined =
          defaultPropertyPath && unEvalEntity[defaultPropertyPath];

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

        const overriddenProperties: string[] = [];

        /**
         * Updates the values of the properties that are overridden by the `defaultPropertyPath`
         */
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

        updatedProperties.push([widgetName, defaultPropertyPath]);
        evalMetaUpdates.push({
          widgetId: evaluatedEntity.widgetId,
          metaPropertyPath: propertyPath.split("."),
          value: finalValue,
        });

        continue;
      }

      /**
       * if no defaultPropertyPath then clear the meta value and send updates to main thread using evalMetaUpdates
       */

      const metaPropertyFullPathArray = [widgetName, `meta.${propertyPath}`];
      const propertyFullPathArray = [widgetName, `${propertyPath}`];
      updatedProperties.push(metaPropertyFullPathArray);
      updatedProperties.push(propertyFullPathArray);

      evalMetaUpdates.push({
        widgetId: evaluatedEntity.widgetId,
        metaPropertyPath: propertyPath.split("."),
        value: undefined,
      });

      _.set(evalTree, metaPropertyFullPathArray.join("."), undefined);
      _.set(evalTree, propertyFullPathArray.join("."), undefined);
    }

    /**
     * - Updates all the meta values which HAVE a DEFAULT path for example, PhoneInput1.text has DEFAULT as PhoneInput1.defaultText
     *
     * - We recalculate the default value mapped to the meta value and set all the values to that. We need to recalculate as,
     * setters can be used to set the defaultValue and to retrieve the original value, we need to rely on the binding in the
     * unevalTree and recompute the value
     *
     */

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

async function resetChildrenMetaProperty(
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

    await resetWidgetMetaProperty(
      childWidget?.widgetName,
      false,
      evalMetaUpdates,
      updatedProperties,
    );
  }
}
