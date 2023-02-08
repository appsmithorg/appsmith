import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { Patch, PatchType, jsVariableUpdates } from "./JSVariableUpdates";

export function jsVariableProxyHandler(
  updateTracker: (patch: Patch) => void,
  path: string,
) {
  return {
    get: function(target: any, prop: string, receiver: any): any {
      const value = target[prop];

      if (typeof value === "function") {
        if (!target.hasOwnProperty(value)) {
          // HACK:
          // Assuming a prototype method call would mutate the property
          updateTracker({
            path,
            method: PatchType.PROTOTYPE_METHOD_CALL,
          });
        }

        return (...args: any[]) => {
          return target[prop](...args);
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
    if (typeof jsObject === "object") {
      return new Proxy(
        Object.assign({}, jsObject, varState),
        jsVariableProxyHandler(addPatch, jsObjectName),
      );
    }
    return jsObject;
  }
}

export const jsVarProxy = new JSProxy();
