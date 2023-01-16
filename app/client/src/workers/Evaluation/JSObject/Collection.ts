type VariableState = Record<string, Record<string, unknown>>;
class JSObjectCollection {
  variableState: VariableState = {};

  setVariableState(variableState: VariableState) {
    this.variableState = variableState;
  }

  getVariableState() {
    return this.variableState;
  }

  removeVariable(fullPath: string) {
    delete this.variableState[fullPath];
  }
}

export const jsObjectCollection = new JSObjectCollection();
