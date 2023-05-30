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
import { set } from "lodash";
import { validate } from "./validations";

export function applySetterMethod(
  path: string,
  value: unknown,
  setterMethodName: string,
) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);

  if (!dataTreeEvaluator) return;

  const evalTree = dataTreeEvaluator.getEvalTree();
  const configTree = dataTreeEvaluator.getConfigTree();

  const entity = evalTree[entityName];
  const entityConfig = configTree[entityName];

  const updatedProperties: string[][] = [];
  const overriddenProperties: string[] = [];
  const evalMetaUpdates: EvalMetaUpdates = [];

  if (value === undefined) {
    const error = new Error("undefined value");
    error.name = entityName + "." + setterMethodName + " failed";
    throw error;
  }

  const { validationPaths } = entityConfig;

  if (validationPaths) {
    const validationConfig = validationPaths[propertyPath] || {};
    const config = { ...validationConfig, params: { strict: true } };
    const { isValid, messages } = validate(
      config,
      value,
      entity as Record<string, unknown>,
      propertyPath,
    );
    if (!isValid) {
      const message = messages && messages[0] ? messages[0].message : "";
      const error = new Error(message);
      error.name = entityName + "." + setterMethodName + " failed";
      throw error;
    }
  }

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

  return new Promise((resolve) => {
    updatedProperties.push([entityName, propertyPath]);

    evalTreeWithChanges(updatedProperties, resolve);
  });
}
