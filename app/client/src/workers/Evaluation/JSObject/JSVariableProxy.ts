import type { Patch } from "./JSVariableUpdates";
import JSVariableUpdates, { PatchType } from "./JSVariableUpdates";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import { isObject } from "lodash";
import type { JSActionEntity } from "entities/DataTree/types";

function addPatch(patch: Patch) {
  JSVariableUpdates.add(patch);
}

const DEFAULT_SET_RETURN_VALUE = true;
const DEFAULT_DELETE_RETURN_VALUE = true;

export function jsObjectProxyHandler(path: string) {
  return {
    get: function (target: any, prop: string): any {
      const value = target[prop];

      // $isProxy property is used to detect if an object is a proxy object or not.
      if (prop === "$isProxy") return true;
      // $targetValue property is used to get the target object.
      if (prop === "$targetValue") return target;

      if (value instanceof Function) {
        /**
         * When path = JSObject's name and value to be returned is a function, then value is
         * JSObject's function property. No modification is required for jsObject's function property. Hence, return the value as it is.
         *
         * */

        if (!path.includes(".")) return value;

        if (!target.hasOwnProperty(value)) {
          // HACK: Assuming a prototype method call would mutate the property.
          const fn = value.bind(target);
          return function (...args: any[]) {
            addPatch({
              path,
              method: PatchType.PROTOTYPE_METHOD_CALL,
              value,
            });
            return fn(...(args || []));
          };
        }
        return value;
      }

      if (isObject(value) && value !== null && !(value as any).$isProxy) {
        return new Proxy(value, jsObjectProxyHandler(`${path}.${prop}`));
      }

      return target[prop];
    },
    set: function (target: any, prop: string, value: unknown, rec: any) {
      if (!ExecutionMetaData.getExecutionMetaData().enableJSVarUpdate)
        return DEFAULT_SET_RETURN_VALUE;
      addPatch({
        path: `${path}.${prop}`,
        method: PatchType.SET,
        value,
      });
      return Reflect.set(target, prop, value, rec);
    },
    deleteProperty: function (target: any, prop: string) {
      if (!ExecutionMetaData.getExecutionMetaData().enableJSVarUpdate)
        return DEFAULT_DELETE_RETURN_VALUE;
      addPatch({
        path: `${path}.${prop}`,
        method: PatchType.DELETE,
      });
      return Reflect.deleteProperty(target, prop);
    },
  };
}

type ProxiedJSObject = JSActionEntity & {
  $isProxy: boolean;
  $targetValue: JSActionEntity;
};

class JSProxy {
  static create(
    jsObject: JSActionEntity,
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ): ProxiedJSObject {
    let proxiedJSObject = jsObject as ProxiedJSObject;

    proxiedJSObject = new Proxy(
      Object.assign({}, varState),
      jsObjectProxyHandler(jsObjectName),
    );

    return proxiedJSObject;
  }
}

export default JSProxy;
