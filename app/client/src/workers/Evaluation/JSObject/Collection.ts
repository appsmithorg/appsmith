import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { klona } from "klona/full";
import { get, set } from "lodash";

export type VariableState = Record<string, Record<string, unknown>>;
class JSObjectCollection {
  private prevVariableState: VariableState = {};
  private currentVariableState: VariableState = {};

  setVariableValue(variableValue: unknown, fullPropertyPath: string) {
    set(
      this.prevVariableState,
      fullPropertyPath,
      get(this.currentVariableState, fullPropertyPath),
    );
    set(this.currentVariableState, fullPropertyPath, variableValue);
  }

  setVariableState(currentVariableState: VariableState) {
    if (this.currentVariableState) {
      this.prevVariableState = this.currentVariableState;
    }

    this.currentVariableState = currentVariableState;
  }

  getCurrentVariableState(
    JSObjectName?: string,
  ): VariableState | Record<string, unknown> {
    if (JSObjectName && this.currentVariableState)
      return klona(this.currentVariableState[JSObjectName]);
    return klona(this.currentVariableState);
  }

  getPrevVariableState() {
    return this.prevVariableState;
  }

  removeVariable(fullPath: string) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const jsObject = this.currentVariableState[entityName];
    if (jsObject && jsObject[propertyPath] !== undefined)
      delete jsObject[propertyPath];
  }
}

export const jsObjectCollection = new JSObjectCollection();
