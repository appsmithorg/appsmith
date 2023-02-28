import { dataTreeEvaluator } from "../handlers/evalTree";
import { isJSAction } from "ce/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { updateEvalTreeValueFromContext } from ".";
import { triggerEvalWithChanges } from "../evalTreeWithChanges";

export enum PatchType {
  "PROTOTYPE_METHOD_CALL" = "PROTOTYPE_METHOD_CALL",
  "DELETE" = "DELETE",
  "SET" = "SET",
}

export type Patch = {
  path: string;
  method: PatchType;
  value?: unknown;
};

class JSVariableUpdates {
  private static patches: Patch[] = [];
  private static disableTracking = true;

  static add(patch: Patch) {
    if (this.disableTracking) return;
    this.patches.push(patch);
    // For every update on variable, we register a task to check for update and
    registerJSVarUpdateTask();
  }

  static getAll() {
    return this.patches;
  }

  static clear() {
    this.patches = [];
  }

  static disable() {
    this.disableTracking = true;
  }

  static enable() {
    this.disableTracking = false;
  }
}

export default JSVariableUpdates;

export function getUpdatedPaths(patches: Patch[]) {
  // store exact path to diff
  const updatedVariablesSet = new Set<string[]>();
  for (const patch of patches) {
    const pathArray = patch.path.split(".");
    const [jsObjectName, varName] = pathArray;
    const dataTree = (dataTreeEvaluator?.evalTree || {}) as DataTree;

    const jsObject = dataTree[jsObjectName];
    if (isJSAction(jsObject)) {
      const variables = jsObject.variables;
      if (variables.includes(varName)) {
        updatedVariablesSet.add(pathArray);
      }
    }
  }
  return [...updatedVariablesSet];
}

let registeredTask = false;

// executes when worker is idle
function applyJSVariableUpdatesToEvalTree() {
  const updates = JSVariableUpdates.getAll();
  const modifiedVariablesList = getUpdatedPaths(updates);

  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    // trigger evaluation
    triggerEvalWithChanges(modifiedVariablesList);
  }
  JSVariableUpdates.clear();
  registeredTask = false;
}

export function registerJSVarUpdateTask(
  task = applyJSVariableUpdatesToEvalTree,
) {
  if (!registeredTask) {
    registeredTask = true;
    queueMicrotask(task);
  }
}
