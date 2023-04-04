import JSFactory from "../JSVariableFactory";
import JSVariableUpdates from "../JSVariableUpdates";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import type { JSActionEntity } from "entities/DataTree/types";

describe("JSVariableFactory", () => {
  it("trigger setters with JSVariableUpdates enabled", async () => {
    const jsObject = {
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown as JSActionEntity;

    const proxiedJSObject = JSFactory.create("JSObject1", jsObject);

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
    });

    proxiedJSObject.number = 5;
    proxiedJSObject.string = "hello world";
    proxiedJSObject.object.a = { b: 2 };
    proxiedJSObject.array.push("hello");
    proxiedJSObject.map.set("a", 1);
    proxiedJSObject.set.add("hello");

    // weakMap: new WeakMap(),
    // weakSet: new WeakSet(),

    expect(JSVariableUpdates.getMap()).toEqual({
      "JSObject1.number": { method: "SET", path: "JSObject1.number", value: 5 },
      "JSObject1.string": {
        method: "SET",
        path: "JSObject1.string",
        value: "hello world",
      },
      "JSObject1.object": {
        method: "GET",
        path: "JSObject1.object",
      },
      "JSObject1.array": {
        method: "GET",
        path: "JSObject1.array",
      },
      "JSObject1.map": {
        method: "GET",
        path: "JSObject1.map",
      },
      "JSObject1.set": {
        method: "GET",
        path: "JSObject1.set",
      },
    });
  });
  it("trigger setters with JSVariableUpdates disabled", async () => {
    const jsObject = {
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown as JSActionEntity;

    const proxiedJSObject = JSFactory.create("JSObject1", jsObject);

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: false,
    });

    proxiedJSObject.number = 5;
    proxiedJSObject.string = "hello world";
    proxiedJSObject.object.a = { b: 2 };
    proxiedJSObject.array.push("hello");
    proxiedJSObject.map.set("a", 1);
    proxiedJSObject.set.add("hello");

    // weakMap: new WeakMap(),
    // weakSet: new WeakSet(),

    expect(JSVariableUpdates.getMap()).toEqual({});
  });
  it("trigger getters with JSVariableUpdates enabled", async () => {
    const jsObject = {
      number: 1,
      string: "aa",
      object: { a: 1 },
      array: [],
      map: new Map(),
      set: new Set(),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    } as unknown as JSActionEntity;

    const proxiedJSObject = JSFactory.create("JSObject1", jsObject);

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
    });

    proxiedJSObject.number;
    proxiedJSObject.string;
    proxiedJSObject.object.a;
    proxiedJSObject.array.push();
    proxiedJSObject.map.set;
    proxiedJSObject.set.add;

    expect(JSVariableUpdates.getMap()).toEqual({
      "JSObject1.array": {
        method: "GET",
        path: "JSObject1.array",
      },
      "JSObject1.map": {
        method: "GET",
        path: "JSObject1.map",
      },
      "JSObject1.number": {
        method: "GET",
        path: "JSObject1.number",
      },
      "JSObject1.object": {
        method: "GET",
        path: "JSObject1.object",
      },
      "JSObject1.set": {
        method: "GET",
        path: "JSObject1.set",
      },
      "JSObject1.string": {
        method: "GET",
        path: "JSObject1.string",
      },
    });
  });
});
