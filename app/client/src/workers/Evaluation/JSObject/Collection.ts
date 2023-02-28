import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { klona } from "klona/full";

export type VariableState = Record<string, Record<string, unknown>>;

export function getOriginalValueFromProxy(obj: Record<string, unknown>) {
  if (obj && obj.$isProxy) {
    return obj.$targetValue;
  }
  return obj;
}

type CurrentJSCollectionState = Record<string, any>;
type ResolvedFunctions = Record<string, any>;

export default class JSObjectCollection {
  private static resolvedFunctions: ResolvedFunctions = {};
  private static unEvalState: CurrentJSCollectionState = {};
  private static currentVariableState: VariableState = {};

  static setResolvedFunctions(resolvedFunctions: ResolvedFunctions) {
    this.resolvedFunctions = resolvedFunctions;
  }

  static getResolvedFunctions() {
    return this.resolvedFunctions;
  }

  static getUnEvalState() {
    return this.unEvalState;
  }

  static setVariableValue(variableValue: unknown, fullPropertyPath: string) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      fullPropertyPath,
    );
    const newVarState = { ...(this.currentVariableState[entityName] || {}) };
    newVarState[propertyPath] = variableValue;
    this.currentVariableState[entityName] = newVarState;
  }

  static setVariableState(currentVariableState: VariableState) {
    this.currentVariableState = currentVariableState;
  }

  static getCurrentVariableState(
    JSObjectName?: string,
  ): VariableState | Record<string, unknown> {
    if (!JSObjectName || !this.currentVariableState)
      return klona(this.currentVariableState);

    return klona(this.currentVariableState[JSObjectName]);
  }

  static removeVariable(fullPath: string) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const jsObject = this.currentVariableState[entityName];
    if (jsObject && jsObject[propertyPath] !== undefined)
      delete jsObject[propertyPath];
  }
}
