import { PatchType } from "./JSVariableUpdates";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import type { JSActionEntity } from "entities/DataTree/types";
import TriggerEmitter, { BatchKey } from "../fns/utils/TriggerEmitter";
import { klona } from "klona/full";

class JSFactory {
  static create(
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ): JSActionEntity {
    const newJSObject: any = {};

    //we need perform deep clone here to pervent a mutation issue with JS actions
    const variables = self.$isDataField
      ? Object.entries(varState)
      : klona(Object.entries(varState));

    for (const [varName, varValue] of variables) {
      let variable = varValue;
      Object.defineProperty(newJSObject, varName, {
        enumerable: true,
        configurable: true,
        get() {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${jsObjectName}.${varName}`,
            method: PatchType.GET,
          });
          return variable;
        },
        set(value) {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${jsObjectName}.${varName}`,
            method: PatchType.SET,
            value,
          });
          variable = value;
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
