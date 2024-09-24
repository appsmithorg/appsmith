import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { klona } from "klona/full";
import { get, set } from "lodash";
import TriggerEmitter, { BatchKey } from "../fns/utils/TriggerEmitter";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import type { JSActionEntity } from "ee/entities/DataTree/types";

export enum PatchType {
  "SET" = "SET",
  "GET" = "GET",
}

export interface Patch {
  path: string;
  method: PatchType;
  value?: unknown;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableState = Record<string, Record<string, any>>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CurrentJSCollectionState = Record<string, any>;
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolvedFunctions = Record<string, any>;

export default class JSObjectCollection {
  private static resolvedFunctions: ResolvedFunctions = {};
  private static unEvalState: CurrentJSCollectionState = {};
  private static variableState: VariableState = {};
  private static prevUnEvalState: CurrentJSCollectionState = {};

  static setResolvedFunctions(resolvedFunctions: ResolvedFunctions) {
    this.resolvedFunctions = resolvedFunctions;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static updateResolvedFunctions(path: string, value: any) {
    set(this.resolvedFunctions, path, value);
  }

  static deleteResolvedFunction(entityName: string) {
    delete this.resolvedFunctions[entityName];
  }

  static getResolvedFunctions() {
    return this.resolvedFunctions;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static updateUnEvalState(path: string, value: any) {
    set(this.unEvalState, path, value);
  }

  static deleteUnEvalState(entityName: string) {
    delete this.unEvalState[entityName];
  }

  static getUnEvalState() {
    return this.unEvalState;
  }

  static setPrevUnEvalState({
    fullPath,
    unEvalValue,
  }: {
    fullPath: string;
    unEvalValue: unknown;
  }) {
    set(this.prevUnEvalState, fullPath, unEvalValue);
  }

  static getPrevUnEvalState({ fullPath }: { fullPath: string }) {
    return get(this.prevUnEvalState, fullPath);
  }

  static setVariableValue(variableValue: unknown, fullPropertyPath: string) {
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(fullPropertyPath);
    const newVarState = { ...this.variableState[entityName] };

    newVarState[propertyPath] = variableValue;
    this.variableState[entityName] = newVarState;
    JSObjectCollection.clearCachedVariablesForEvaluationContext(entityName);
  }

  static getVariableState(
    JSObjectName?: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): VariableState | Record<string, any> {
    if (!JSObjectName || !this.variableState) return klona(this.variableState);

    return this.variableState[JSObjectName];
  }

  static removeVariable(fullPath: string) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const jsObject = this.variableState[entityName];

    if (jsObject && jsObject[propertyPath] !== undefined)
      delete jsObject[propertyPath];
  }

  /**Map<JSObjectName, Map<variableName, variableValue> */
  static cachedJSVariablesByEntityName: Record<string, JSActionEntity> = {};

  /**Computes  Map<JSObjectName, Map<variableName, variableValue> with getters & setters to track JS mutations
   * We cache and reuse this map. We recreate only when the JSObject's content changes or when any of the variables
   * gets evaluated
   */
  static getVariablesForEvaluationContext(entityName: string) {
    if (JSObjectCollection.cachedJSVariablesByEntityName[entityName])
      return JSObjectCollection.cachedJSVariablesByEntityName[entityName];

    const varState = JSObjectCollection.getVariableState(entityName);
    const variables = Object.entries(varState);
    const newJSObject = {} as JSActionEntity;

    for (const [varName, varValue] of variables) {
      let variable = varValue;

      Object.defineProperty(newJSObject, varName, {
        enumerable: true,
        configurable: true,
        get() {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${entityName}.${varName}`,
            method: PatchType.GET,
          });

          return variable;
        },
        set(value) {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${entityName}.${varName}`,
            method: PatchType.SET,
            value,
          });
          variable = value;
        },
      });
    }

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
    });
    JSObjectCollection.cachedJSVariablesByEntityName[entityName] = newJSObject;

    return JSObjectCollection.cachedJSVariablesByEntityName[entityName];
  }

  static clearCachedVariablesForEvaluationContext(entityName: string) {
    delete JSObjectCollection.cachedJSVariablesByEntityName[entityName];
  }

  static clear() {
    this.variableState = {};
    this.unEvalState = {};
    this.prevUnEvalState = {};
    this.resolvedFunctions = {};
  }
}
