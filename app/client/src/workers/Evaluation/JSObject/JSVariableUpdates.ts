import { dataTreeEvaluator } from "../handlers/evalTree";
import { getEntityNameAndPropertyPath } from "ce/workers/Evaluation/evaluationUtils";
import { updateEvalTreeValueFromContext } from ".";
import { evalTreeWithChanges } from "../evalTreeWithChanges";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import { get } from "lodash";
import { isJSObjectVariable } from "./utils";
import isDeepEqualES6 from "fast-deep-equal/es6";

export enum PatchType {
  "SET" = "SET",
  "GET" = "GET",
}

export type Patch = {
  path: string;
  method: PatchType;
  value?: unknown;
};

export type UpdatedPathsMap = Record<string, Patch>;

class JSVariableUpdates {
  private static potentialUpdatedPathsMap: UpdatedPathsMap = {};

  static add(patch: Patch) {
    if (!ExecutionMetaData.getExecutionMetaData().enableJSVarUpdateTracking)
      return;
    this.potentialUpdatedPathsMap[patch.path] = patch;
    /**
     *  For every update on variable, we register a task to check for update updates and apply
     *  them to eval tree.
     */
    registerJSVarUpdateTask();
  }

  static getMap() {
    return this.potentialUpdatedPathsMap;
  }

  static clear() {
    this.potentialUpdatedPathsMap = {};
  }
}

export default JSVariableUpdates;

export function getUpdatedPaths(potentialUpdatedPathsMap: UpdatedPathsMap) {
  // store exact path to diff
  const updatedVariables = [];

  const patches = Object.entries(potentialUpdatedPathsMap);

  for (const [fullPath, patch] of patches) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    if (!dataTreeEvaluator) continue;
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

let jsVarUpdateTaskRegistered = false;

// executes when worker is idle
function applyJSVariableUpdatesToEvalTree() {
  const modifiedVariablesList = getUpdatedPaths(JSVariableUpdates.getMap());

  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    evalTreeWithChanges(modifiedVariablesList);
  }
  JSVariableUpdates.clear();
  jsVarUpdateTaskRegistered = false;
}

export function registerJSVarUpdateTask(
  task = applyJSVariableUpdatesToEvalTree,
) {
  if (!jsVarUpdateTaskRegistered) {
    jsVarUpdateTaskRegistered = true;
    queueMicrotask(task);
  }
}
