import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import JSProxy from "../JSVariableProxy";
import JSVariableUpdates from "../JSVariableUpdates";

describe("JSVariableProxy", () => {
  it("trigger setters with JSVariableUpdates enabled", async () => {
    const jsObject = ({
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown) as DataTreeJSAction;

    const proxiedJSObject = JSProxy.create(jsObject, "JSObject1", jsObject);

    JSVariableUpdates.enableTracking();

    proxiedJSObject.number = 5;
    proxiedJSObject.string = "hello world";
    proxiedJSObject.object.a = { b: 2 };
    proxiedJSObject.array.push("hello");
    proxiedJSObject.map.set("a", 1);
    proxiedJSObject.set.add("hello");

    // weakMap: new WeakMap(),
    // weakSet: new WeakSet(),

    expect(JSVariableUpdates.getAll()).toEqual([
      { method: "SET", path: "JSObject1.number", value: 5 },
      { method: "SET", path: "JSObject1.string", value: "hello world" },
      {
        method: "SET",
        path: "JSObject1.object.a",
        value: {
          b: 2,
        },
      },
      {
        method: "PROTOTYPE_METHOD_CALL",
        path: "JSObject1.array",
        value: [].push,
      },
      {
        method: "PROTOTYPE_METHOD_CALL",
        path: "JSObject1.map",
        value: new Map().set,
      },
      {
        method: "PROTOTYPE_METHOD_CALL",
        path: "JSObject1.set",
        value: new Set().add,
      },
    ]);
  });
  it("trigger setters with JSVariableUpdates disabled", async () => {
    const jsObject = ({
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown) as DataTreeJSAction;

    const proxiedJSObject = JSProxy.create(jsObject, "JSObject1", jsObject);

    JSVariableUpdates.disableTracking();

    proxiedJSObject.number = 5;
    proxiedJSObject.string = "hello world";
    proxiedJSObject.object.a = { b: 2 };
    proxiedJSObject.array.push("hello");
    proxiedJSObject.map.set("a", 1);
    proxiedJSObject.set.add("hello");

    // weakMap: new WeakMap(),
    // weakSet: new WeakSet(),

    expect(JSVariableUpdates.getAll()).toEqual([]);
  });
  it("trigger getters with JSVariableUpdates enabled", async () => {
    const jsObject = ({
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown) as DataTreeJSAction;

    const proxiedJSObject = JSProxy.create(jsObject, "JSObject1", jsObject);

    JSVariableUpdates.enableTracking();

    proxiedJSObject.number;
    proxiedJSObject.string;
    proxiedJSObject.object.a;
    proxiedJSObject.array.push(); // patch added
    proxiedJSObject.map.set; // no patch
    proxiedJSObject.set.add; // no patch

    expect(JSVariableUpdates.getAll()).toEqual([
      {
        method: "PROTOTYPE_METHOD_CALL",
        path: "JSObject1.array",
        value: [].push,
      },
    ]);
  });
});
