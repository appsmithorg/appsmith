import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { klona } from "klona/full";
import { get, set } from "lodash";

export type VariableState = Record<string, Record<string, unknown>>;

export function getOriginalValueFromProxy(obj: Record<string, unknown>) {
  if (obj && obj.$isProxy) {
    return obj.$targetValue;
  }
  return obj;
}

type CurrentJSCollectionState = Record<string, any>;
type ResolvedFunctions = Record<string, any>;

class JSObjectCollection {
  private resolvedFunctions: ResolvedFunctions = {};
  private unEvalState: CurrentJSCollectionState = {};

  private prevVariableState: VariableState = {};
  private currentVariableState: VariableState = {};

  setResolvedFunctions(resolvedFunctions: ResolvedFunctions) {
    this.resolvedFunctions = resolvedFunctions;
  }

  getResolvedFunctions() {
    return this.resolvedFunctions;
  }

  getUnEvalState() {
    return this.unEvalState;
  }

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
