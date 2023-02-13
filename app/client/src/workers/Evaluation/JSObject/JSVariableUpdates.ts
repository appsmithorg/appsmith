import { dataTreeEvaluator } from "../handlers/evalTree";
import { isJSAction } from "ce/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";

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
  private patches: Patch[] = [];
  private disableTracking = true;

  add(patch: Patch) {
    if (this.disableTracking) return;
    this.patches.push(patch);
  }

  getAll() {
    return this.patches;
  }

  clear() {
    this.patches = [];
  }

  disable() {
    this.disableTracking = true;
  }

  enable() {
    this.disableTracking = false;
  }
}

export const jsVariableUpdates = new JSVariableUpdates();

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
