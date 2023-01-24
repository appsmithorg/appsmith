import { diff } from "deep-diff";
import { jsObjectCollection } from "./Collection";
import { get, isArray } from "lodash";

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

class MutationPatches {
  private patches: Patch[] = [];
  private disableTracking = true;

  add(patch: Patch) {
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

export const jsVariableUpdates = new MutationPatches();

export function filterPatches(patches: Patch[]) {
  const modifiedVariablesSet = new Set<string>();
  for (const patch of patches) {
    const [jsObjectName, varName] = patch.path.split(".");
    modifiedVariablesSet.add(`${jsObjectName}.${varName}`);
  }
  return [...modifiedVariablesSet];
}

export function diffModifiedVariables(modifiedJSVariableList: string[]) {
  const prevState = jsObjectCollection.getPrevVariableState();
  const currentState = jsObjectCollection.getCurrentVariableState();
  const variableDiffCollection = [];
  for (const jsVariablePath of modifiedJSVariableList) {
    const variableDiff = diff(
      get(prevState, jsVariablePath),
      get(currentState, jsVariablePath),
    );

    if (variableDiff && variableDiff[0]) {
      if (isArray(variableDiff[0].path)) {
        const difference = variableDiff[0].path;
        difference.unshift(...jsVariablePath.split("."));
      }
    }
    variableDiffCollection.push(variableDiff);
  }
  return variableDiffCollection;
}
