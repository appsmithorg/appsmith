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
    if (JSVariableUpdates.disableTracking) return;
    JSVariableUpdates.patches.push(patch);
    registerJSUpdateCheckTask();
  }

  static getAll() {
    return JSVariableUpdates.patches;
  }

  static clear() {
    JSVariableUpdates.patches = [];
  }

  static disable() {
    JSVariableUpdates.disableTracking = true;
  }

  static enable() {
    JSVariableUpdates.disableTracking = false;
  }
}

export default JSVariableUpdates;

export function getModifiedPaths(patches: Patch[]) {
  // store exact path to diff
  const modifiedVariablesSet = new Set<string[]>();
  for (const patch of patches) {
    const pathArray = patch.path.split(".");
    const [jsObjectName, varName] = pathArray;
    const dataTree = (dataTreeEvaluator?.evalTree || {}) as DataTree;

    const jsObject = dataTree[jsObjectName];
    if (isJSAction(jsObject)) {
      const variables = jsObject.variables;
      if (variables.includes(varName)) {
        modifiedVariablesSet.add(pathArray);
      }
    }
  }
  return [...modifiedVariablesSet];
}

let registeredTask = false;

// executes when worker is idle
function checkForJsVariableUpdate() {
  const updates = JSVariableUpdates.getAll();
  const modifiedVariablesList = getModifiedPaths(updates);

  updateEvalTreeValueFromContext(modifiedVariablesList);

  if (modifiedVariablesList.length > 0) {
    // trigger evaluation
    triggerEvalWithChanges(modifiedVariablesList);
  }
  JSVariableUpdates.clear();
  registeredTask = false;
}

export function registerJSUpdateCheckTask(task = checkForJsVariableUpdate) {
  if (!registeredTask) {
    registeredTask = true;
    queueMicrotask(task);
  }
}
