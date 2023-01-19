import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";

type VariableState = Record<string, Record<string, unknown>>;
class JSObjectCollection {
  variableState: VariableState = {};

  setVariableState(variableState: VariableState) {
    this.variableState = variableState;
  }

  getVariableState(JSObjectName?: string) {
    if (JSObjectName) return this.variableState[JSObjectName];
    return this.variableState;
  }

  removeVariable(fullPath: string) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const jsObject = this.variableState[entityName];
    delete jsObject[propertyPath];
  }
}

export const jsObjectCollection = new JSObjectCollection();
