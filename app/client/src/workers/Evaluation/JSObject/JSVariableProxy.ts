import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { Patch, PatchType, jsVariableUpdates } from "./JSVariableUpdates";

export function jsVariableProxyHandler(
  updateTracker: (patch: Patch) => void,
  path: string,
) {
  return {
    get: function(target: any, prop: string, receiver: any): any {
      const value = target[prop];

      if (prop === "__isProxy") return true;
      if (prop === "__originalValue") return target;

      if (value instanceof Function) {
        if (!target.hasOwnProperty(value)) {
          // HACK:
          // Assuming a prototype method call would mutate the property
          updateTracker({
            path,
            method: PatchType.PROTOTYPE_METHOD_CALL,
          });
        }
        return function(...args: any[]) {
          // @ts-expect-error: this error
          return value.apply(this === receiver ? target : this, args);
        };
      }

      if (typeof value === "object" && value !== null) {
        return new Proxy(
          value,
          jsVariableProxyHandler(updateTracker, `${path}.${prop}`),
        );
      }

      return Reflect.get(target, prop, receiver);
    },
    set: function(target: any, prop: string, value: unknown, rec: any) {
      updateTracker({
        path: `${path}.${prop}`,
        method: PatchType.SET,
      });
      return Reflect.set(target, prop, value, rec);
    },
    deleteProperty: function(target: any, prop: string) {
      updateTracker({
        path: `${path}.${prop}`,
        method: PatchType.DELETE,
      });
      return Reflect.deleteProperty(target, prop);
    },
  };
}

function addPatch(patch: Patch) {
  jsVariableUpdates.add(patch);
}

class JSProxy {
  fromJSObject(
    jsObject: DataTreeJSAction,
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ) {
    let proxiedJSObject = jsObject;
    const __originalValue = Object.assign({}, jsObject, varState);
    if (typeof jsObject === "object") {
      proxiedJSObject = new Proxy(
        __originalValue,
        jsVariableProxyHandler(addPatch, jsObjectName),
      );
    }

    return proxiedJSObject;
  }
}

export const jsVarProxy = new JSProxy();
