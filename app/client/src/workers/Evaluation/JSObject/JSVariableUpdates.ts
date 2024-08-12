import { dataTreeEvaluator } from "../handlers/evalTree";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { updateEvalTreeValueFromContext } from ".";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import { get } from "lodash";
import { isJSObjectVariable } from "./utils";
import isDeepEqualES6 from "fast-deep-equal/es6";
import type { Patch } from "./Collection";
import { PatchType } from "./Collection";
import { EVAL_WORKER_SYNC_ACTION } from "ee/workers/Evaluation/evalWorkerActions";

export type UpdatedPathsMap = Record<string, Patch>;

export function getUpdatedPaths(potentialUpdatedPathsMap: UpdatedPathsMap) {
  // store exact path to diff
  const updatedVariables: string[][] = [];

  const patches = Object.entries(potentialUpdatedPathsMap);

  if (!dataTreeEvaluator) return updatedVariables;

  for (const [fullPath, patch] of patches) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const configTree = dataTreeEvaluator?.oldConfigTree;

    if (!isJSObjectVariable(entityName, propertyPath, configTree)) continue;

    if (patch.method === PatchType.SET) {
      updatedVariables.push([entityName, propertyPath]);
      continue;
    }

    // if the value is not set, we need to check if the value is different from the global value
    const oldValue = get(dataTreeEvaluator.getEvalTree(), fullPath);
    const newValue = get(self, fullPath);
    // Shallow comparison for dataTypes like weakMap, weakSet and object that cannot be compared
    if (oldValue !== newValue && !isDeepEqualES6(oldValue, newValue)) {
      updatedVariables.push([entityName, propertyPath]);
    }
  }
  return updatedVariables;
}

// executes when worker is idle
export function applyJSVariableUpdatesToEvalTree(updatesMap: UpdatedPathsMap) {
  const modifiedVariablesList = getUpdatedPaths(updatesMap);
  if (!modifiedVariablesList.length) return;

  updateEvalTreeValueFromContext(modifiedVariablesList);
  /**
   *  Only evaluate the dependents of the updatedValue and
   *  skip the evaluation of updatedValue itself.
   *
   *  Example:
   *  if "JSObject.myVar1" is updated
   *  then => only re-evaluate values dependent on "JSObject.myVar1"
   */

  evalTreeWithChanges({
    data: {
      updatedValuePaths: modifiedVariablesList,
    },
    method: EVAL_WORKER_SYNC_ACTION.EVAL_TREE_WITH_CHANGES,
    webworkerTelemetry: {},
  });
}
