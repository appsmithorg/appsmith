import { enableMapSet, enablePatches, produceWithPatches } from "immer";
import { createDraft, finishDraft } from "immer";

/**
 * Create settings and getters for data Proxy
 * @param  {Constructor} instance The current instantiation
 * @return {Object}               The setter and getter methods for the Proxy
 */
const handlermethod = {
  get: function(obj: Record<string, any>, prop: string, receiver: any): any {
    // If the property is an array or object and not already a proxy, make it one

    // If the property is "isProxy", item is already being intercepted by this proxy handler
    // return true
    if (prop === "_isProxy") return true;

    const value = obj[prop];

    if (typeof value === "function") {
      return function(...args: any[]) {
        console.log("get", "FUNCTION", receiver, args);
        return obj[prop](...args);
      };
    }

    // If the property is an array or object and not already a proxy, make it one
    if (typeof value === "object" && !value._isProxy) {
      console.log("get", "PROXY GEN", value);
      return new Proxy(value, handlermethod);
    }

    return Reflect.get(obj, prop, receiver);
  },
  set: function(
    obj: Record<string, any>,
    prop: string,
    value: unknown,
    rec: any,
  ) {
    console.log("set", obj, "prop", prop);
    if (obj[prop] === value) return true;
    return Reflect.set(obj, prop, rec);
  },
  deleteProperty: function(obj: Record<string, any>, prop: string) {
    console.log("delete", obj, "prop", prop);
    return Reflect.deleteProperty(obj, prop);
  },
};

describe("Mutation", () => {
  // it("immer mutation", () => {
  //   const setValue = new Set([1]);

  //   const dataTreeWithOnlyJSObjects = {
  //     JSObject1: setValue,
  //     JSObject2: {
  //       myVar2: { values: [], value2: setValue },
  //     },
  //   };

  //   Object.assign(self, dataTreeWithOnlyJSObjects);

  //   enableMapSet();
  //   enablePatches();

  //   const draft = createDraft(dataTreeWithOnlyJSObjects);

  //   const b = draft;
  //   b.JSObject1.add(3);
  //   console.log(draft);

  //   const newState = finishDraft(draft);
  //   console.log("newState", newState);

  //   // const [newState, patches] = produceWithPatches(
  //   //   dataTreeWithOnlyJSObjects,
  //   //   (draft) => {
  //   //     console.log(draft["JSObject1"]);
  //   //     for (const jsObjectname of Object.keys(dataTreeWithOnlyJSObjects)) {
  //   //       self[jsObjectname] = draft[jsObjectname];
  //   //     }

  //   //     JSObject1.setValue.add(5);
  //   //     JSObject2.myVar2.values.push(6);
  //   //   },
  //   // );

  //   // console.log(patches);
  // });

  it("Global scope value mutation tracking", async () => {
    const map = new Map();
    const dataTree = {
      JSObject1: map,
      JSObject2: {
        myVar2: { values: [], value2: map },
      },
    };

    const newDataTree = new Proxy(dataTree, handlermethod);

    Object.assign(self, newDataTree);

    eval(`console.log("result",JSObject1.set("a", "3"));`);
  });
});
