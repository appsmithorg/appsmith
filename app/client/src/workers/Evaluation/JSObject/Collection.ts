import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { set } from "lodash";

type VariableState = Record<string, Record<string, unknown>>;
class JSObjectCollection {
  variableState: VariableState = {};

  setVariableValue(variableValue: unknown, fullPropertyPath: string) {
    set(this.variableState, fullPropertyPath, variableValue);
  }

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
    if (jsObject) delete jsObject[propertyPath];
  }
}

export const jsObjectCollection = new JSObjectCollection();
