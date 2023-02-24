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

  setResolvedFunctions(resolvedFunctions: ResolvedFunctions) {
    this.resolvedFunctions = resolvedFunctions;
  }

  getResolvedFunctions() {
    return this.resolvedFunctions;
  }

  getUnEvalState() {
    return this.unEvalState;
  }
}

export const jsObjectCollection = new JSObjectCollection();
