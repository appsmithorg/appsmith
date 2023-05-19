import {
  getEntityNameAndPropertyPath,
  isWidget,
  overrideWidgetProperties,
} from "ce/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "ce/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "./evalTreeWithChanges";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./fns/utils/Messenger";
import { dataTreeEvaluator } from "./handlers/evalTree";
import { get, set } from "lodash";

export function applySetterMethod(path: string, value: unknown) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
  const evalTree = dataTreeEvaluator?.getEvalTree();
  const configTree = dataTreeEvaluator?.getConfigTree();

  if (!evalTree || !configTree) return;

  const entity = get(evalTree, entityName);
  const updatedProperties: string[][] = [];
  const overriddenProperties: string[] = [];
  const evalMetaUpdates: EvalMetaUpdates = [];

  if (isWidget(entity)) {
    overrideWidgetProperties({
      entity,
      propertyPath,
      value,
      currentTree: evalTree,
      configTree,
      evalMetaUpdates,
      fullPropertyPath: path,
      isNewWidget: false,
      shouldUpdateGlobalContext: true,
      overriddenProperties,
    });

    overriddenProperties.forEach((propPath) => {
      updatedProperties.push([entityName, propPath]);

      if (propPath.split(".")[0] === "meta") {
        const metaPropertyPath = propPath.split(".").slice(1);

        evalMetaUpdates.push({
          widgetId: entity.widgetId,
          metaPropertyPath,
          value,
        });

        WorkerMessenger.request({
          method: MAIN_THREAD_ACTION.SET_META_PROP_FROM_SETTER,
          data: { evalMetaUpdates },
        });
      }
    });
  }

  set(evalTree, path, value);
  set(self, path, value);

  // dataTreeEvaluator?.setEvalTree(evalTree);

  return new Promise((resolve) => {
    updatedProperties.push([entityName, propertyPath]);

    evalTreeWithChanges(updatedProperties, resolve);
  });
}
