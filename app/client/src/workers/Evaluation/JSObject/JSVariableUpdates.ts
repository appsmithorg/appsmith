import { dataTreeEvaluator } from "../handlers/evalTree";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { updateEvalTreeValueFromContext } from ".";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import { get } from "lodash";
import { isJSObjectVariable } from "./utils";
import isDeepEqualES6 from "fast-deep-equal/es6";
import type { Patch } from "./Collection";
import { PatchType } from "./Collection";

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
    const newValue = get(globalThis, fullPath);
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

  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    evalTreeWithChanges(modifiedVariablesList);
  }
}
