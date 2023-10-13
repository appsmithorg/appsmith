import { PatchType } from "./JSVariableUpdates";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import TriggerEmitter, { BatchKey } from "../fns/utils/TriggerEmitter";

class JSFactory {
  static create(
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ): JSActionEntity {
    const newJSObject: any = {};

    const variables = Object.entries(varState);

    for (const [varName] of variables) {
      Object.defineProperty(newJSObject, varName, {
        enumerable: true,
        configurable: true,
        get() {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${jsObjectName}.${varName}`,
            method: PatchType.GET,
          });
          return varState[varName];
        },
        set(value) {
          TriggerEmitter.emit(BatchKey.process_js_variable_updates, {
            path: `${jsObjectName}.${varName}`,
            method: PatchType.SET,
            value,
          });
          varState[varName] = value;
        },
      });
    }

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
    });

    return newJSObject;
  }
}

export default JSFactory;
