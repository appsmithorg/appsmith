import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { jsVariableUpdates } from "./MutationPatches";

export function jsVariableProxyHandler(
  updateTracker: (v: any) => void,
  variablePath: string,
) {
  return {
    get: function(target: any, prop: string, receiver: any): any {
      const value = target[prop];

      if (typeof value === "function") {
        if (!target.hasOwnProperty(value)) {
          // HACK:
          // Assuming a prototype method call would mutate the property
          updateTracker({ variablePath, method: "PROTOTYPE_METHOD_CALL" });
        }

        return (...args: any[]) => {
          return target[prop](...args);
        };
      }

      if (typeof value === "object" && !value._isProxy) {
        return new Proxy(
          value,
          jsVariableProxyHandler(updateTracker, `${variablePath}.${prop}`),
        );
      }

      return Reflect.get(target, prop, receiver);
    },
    set: function(target: any, prop: string, value: unknown, rec: any) {
      updateTracker({
        variablePath: `${variablePath}.${prop}`,
        method: "SET",
      });
      return Reflect.set(target, prop, value, rec);
    },
    deleteProperty: function(target: any, prop: string) {
      updateTracker({
        variablePath: `${variablePath}.${prop}`,
        method: "DELETE",
      });
      return Reflect.deleteProperty(target, prop);
    },
  };
}

export class JSProxy {
  create(jsObject: DataTreeJSAction) {
    const variableNames = jsObject.variables;

    const newJSObject: any = {};
    for (const varName of variableNames) {
      newJSObject[varName] = new Proxy(
        jsObject[varName],
        jsVariableProxyHandler((patch) => {
          jsVariableUpdates.add(patch);
        }, varName),
      );
    }

    return newJSObject;
  }
}
