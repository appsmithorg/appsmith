import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { Patch, PatchType, jsVariableUpdates } from "./JSVariableUpdates";

export function jsObjectProxyHandler(
  addPatch: (patch: Patch) => void,
  path: string,
) {
  return {
    get: function(target: any, prop: string): any {
      const value = target[prop];

      // $isProxy property is used to detect if an object is a proxy object or not.
      if (prop === "$isProxy") return true;
      // $targetValue property is used to get the target object.
      if (prop === "$targetValue") return target;

      if (value instanceof Function) {
        if (!target.hasOwnProperty(value)) {
          // HACK:
          // Assuming a prototype method call would mutate the property
          addPatch({
            path,
            method: PatchType.PROTOTYPE_METHOD_CALL,
          });
        }
        return value.bind(target);
      }

      if (typeof value === "object" && value !== null && !value.$isProxy) {
        return new Proxy(
          value,
          jsObjectProxyHandler(addPatch, `${path}.${prop}`),
        );
      }

      return target[prop];
    },
    set: function(target: any, prop: string, value: unknown, rec: any) {
      addPatch({
        path: `${path}.${prop}`,
        method: PatchType.SET,
      });
      return Reflect.set(target, prop, value, rec);
    },
    deleteProperty: function(target: any, prop: string) {
      addPatch({
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

type ProxiedJSObject = DataTreeJSAction & {
  $isProxy: boolean;
  $targetValue: DataTreeJSAction;
};

class JSProxy {
  static create(
    jsObject: DataTreeJSAction,
    jsObjectName: string,
    varState: Record<string, unknown> = {},
  ): ProxiedJSObject {
    let proxiedJSObject = jsObject as ProxiedJSObject;

    if (typeof jsObject === "object") {
      proxiedJSObject = new Proxy(
        Object.assign({}, varState),
        jsObjectProxyHandler(addPatch, jsObjectName),
      );
    }

    return proxiedJSObject;
  }
}

export default JSProxy;
