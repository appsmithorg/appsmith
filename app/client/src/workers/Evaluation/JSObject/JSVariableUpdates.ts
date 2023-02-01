import { diff } from "deep-diff";
import { jsObjectCollection } from "./Collection";
import { get } from "lodash";

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
    const currentValue = get(currentState, jsVariablePath);
    const prevValue = get(prevState, jsVariablePath);

    const variableDiff = diff(prevValue, currentValue);

    if (variableDiff && variableDiff[0]) {
      const path = jsVariablePath.split(".");
      if (variableDiff[0].path) {
        path.concat(variableDiff[0].path);
      }
      variableDiff[0].path = path;
      variableDiffCollection.push(...variableDiff);
    }
  }
  return variableDiffCollection;
}
