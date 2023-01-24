import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";

export type VariableState = Record<string, Record<string, unknown>>;
class JSObjectCollection {
  private prevVariableState: VariableState = {};
  private currentVariableState: VariableState = {};

  setVariableState(currentVariableState: VariableState) {
    if (this.currentVariableState)
      this.prevVariableState = this.currentVariableState;
    this.currentVariableState = currentVariableState;
  }

  getCurrentVariableState(JSObjectName?: string) {
    if (JSObjectName && this.currentVariableState)
      return this.currentVariableState[JSObjectName];
    return this.currentVariableState;
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
