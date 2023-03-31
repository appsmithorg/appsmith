import JSVariableUpdates, { PatchType } from "./JSVariableUpdates";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import type { JSActionEntity } from "entities/DataTree/types";

class JSFactory {
  static create(
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ): JSActionEntity {
    const newJSObject: any = {};

    const variables = Object.entries(varState);

    for (const [varName, varValue] of variables) {
      Object.defineProperty(newJSObject, varName, {
        get() {
          JSVariableUpdates.add({
            path: `${jsObjectName}.${varName}`,
            method: PatchType.GET,
          });
          return varState[varName];
        },
        set(value) {
          JSVariableUpdates.add({
            path: `${jsObjectName}.${varName}`,
            method: PatchType.SET,
            value,
          });
          varState[varName] = value;
        },
      });

      ExecutionMetaData.setExecutionMetaData({
        enableJSVarUpdateTracking: false,
      });
      newJSObject[varName] = varValue;

      ExecutionMetaData.setExecutionMetaData({
        enableJSVarUpdateTracking: true,
      });
    }

    return newJSObject;
  }
}

export default JSFactory;
