import { jsVariableProxyHandler } from "../JSVariableProxy";
import { jsVariableUpdates } from "../MutationPatches";

describe("Mutation", () => {
  it("Global scope value mutation tracking", async () => {
    const map = new Map();
    const dataTree = {
      JSObject1: { var: { a: [], b: new Set([1, 2]) } },
      JSObject2: [...map],
    };

    const newJSObject1 = new Proxy(
      dataTree.JSObject1.var,
      jsVariableProxyHandler((patch) => {
        jsVariableUpdates.add(patch);
      }, "var"),
    );

    self["JSObject1"] = { var: newJSObject1 };

    eval(`
    JSObject1.var.b = {}
    JSObject1.var.b.a = {}
    JSObject1.var.b.a = [];
    JSObject1.var.b.a.push(2);
    
    `);

    expect(jsVariableUpdates.getAll()).toEqual([
      { variablePath: "var.b", method: "SET" },
      { variablePath: "var.b.a", method: "SET" },
      { variablePath: "var.b.a", method: "SET" },
      { variablePath: "var.b.a", method: "PROTOTYPE_METHOD_CALL" },
    ]);
  });
});
